# Data Model: Tactical HUD OHCA Field Timer

All application state derives from a single **case** holding an **events** array plus
a few timer anchors. Every summary number (drug/shock counts, initial rhythm, airway,
last vitals, drug countdowns) is **derived** from `events`, never stored separately —
this guarantees FR-016 consistency: adding or deleting an event updates the whole UI.

Source of truth for shapes: `design-reference/project/ohca-core.jsx` (`useOHCA`).

## Entities

### CaseState (the persisted root)

| Field | Type | Notes |
|-------|------|-------|
| `caseStart` | `number` (epoch ms) | When the case clock started; auto-set on first open, adjustable (FR-001). Elapsed = `now - caseStart`. |
| `rosc` | `number \| null` | Timestamp of ROSC declaration; `null` until declared (FR-014). Does **not** stop the clock. |
| `arrived` | `number \| null` | Timestamp of hospital arrival; `null` until declared (FR-014). Does **not** stop the clock. |
| `cpr` | `{ startAt: number \| null }` | CPR cycle anchor; `null` until the rescuer starts the cycle (FR-002). |
| `events` | `Event[]` | The single source of truth; sorted newest-first for display. |
| `schemaVersion` | `number` | Persistence schema version for safe migration (persistence module). |

**Lifecycle**: A case exists from app open until **new case** (FR-015) resets all
fields (`caseStart = now`, `rosc/arrived = null`, `cpr.startAt = null`, `events = []`).
Persisted indefinitely until new case or manual clear (FR-020). Single active case
only — no history list in this feature.

### Event (one timeline entry)

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Unique (`'e' + at + random`). |
| `at` | `number` (epoch ms) | When the action occurred. Relative offset = `at - caseStart`. |
| `kind` | `EventKind` | Discriminator (see below). |
| `label` | `string` | Human-readable zh-Hant label (e.g., `Epinephrine 第 2 劑`). |
| `detail?` | `string` | Optional secondary line (e.g., vitals summary). |
| `rhythm?` | `string` | For `rhythm` events — the rhythm label/key. |
| `airwayType?` | `string` | For `airway` events — device name. |
| `airwaySize?` | `string \| null` | For `airway` events — ETT size when applicable. |
| `vitals?` | `Vitals` | For `vitals` events — the captured reading. |

**EventKind** (discriminated union): `'epi' | 'amio' | 'defib' | 'iv' | 'rhythm' |
'airway' | 'vitals' | 'rosc' | 'arrival' | 'note'`. Each kind has fixed visual
identity (tag, name, color, glyph) in `EVENT_META` — color per FR-018:
epi `#E5484D`, amio `#0E9C9C`, defib `#F0883E`, iv `#C08A2E`, rhythm `#6E56CF`,
airway `#9F5BD6`, vitals `#3E63DD`, rosc `#1FA463`, arrival `#9B1C2E`, note `#7A8290`.

### Vitals (embedded in a `vitals` event)

| Field | Type | Notes |
|-------|------|-------|
| `sys?` | `string` | Systolic BP (mmHg). |
| `dia?` | `string` | Diastolic BP (mmHg). |
| `map?` | `number \| null` | Mean arterial pressure, **derived**: `round(dia + (sys - dia)/3)`; `null` if either BP missing (FR-009, edge case). |
| `hr?` | `string` | Heart rate (/min). |
| `spo2?` | `string` | SpO₂ (%). |
| `etco2?` | `string` | EtCO₂ (mmHg). |
| `temp?` | `string` | Temperature (°C, allows decimal). |
| `ecg?` | `string` | Optional free-text ECG/4-lead note (FR-010). |

## Derived values (pure functions of `events` + timer anchors)

| Derived | Rule | Requirement |
|---------|------|-------------|
| `elapsedSec` | `floor((now - caseStart)/1000)`; format mm:ss, h:mm:ss past 60 min | FR-001 |
| `epi.count` / `amio.count` / `shocks` | count of events with kind `epi` / `amio` / `defib` | FR-003/004/005, FR-011 |
| `epiLast` / `amioLast` | max `at` among that kind, else `null` | FR-003/004 |
| `epiRemain` | `EPI_INTERVAL(180) - (now - epiLast)/1000`; `null` if none | FR-003 |
| `amioRemain` | `AMIO_INTERVAL(240) - (now - amioLast)/1000`; `null` if none | FR-004 |
| `cprRemain` | `CPR_CYCLE(120) - ((now - cpr.startAt)/1000 mod 120)`; `null` if not started | FR-002 |
| `cprCycleNum` | `floor((now - cpr.startAt)/1000 / 120) + 1` | FR-002 |
| `ivDone` | any event kind `iv` | FR-006 |
| `initialRhythm` | rhythm of the **earliest** `rhythm` event | FR-007 |
| `lastRhythm` | rhythm of the **latest** `rhythm` event | FR-007 |
| `airway` | latest `airway` event → `{ type, size }`, default `{ type:'無', size:null }` | FR-008 |
| `lastVitals` | `vitals` of the latest `vitals` event | FR-003/US3 |

`due` cues: a drug tile signals "due" when its `*Remain <= 0` (FR-003). The CPR bar
shows the switch/rhythm-check warning when `cprRemain <= 15` (FR-002).

## Validation & rules

- Numeric keypad entries are strings capped at 4 chars; `temp` permits one `.`
  (mirrors prototype `NumPad`). No hard clinical range validation in this feature
  (clinical accuracy follows the reference design — see spec Assumptions).
- Logging a drug is always permitted regardless of countdown (the countdown is a
  reminder, never a lock — Edge Cases).
- A vitals commit is allowed when **any** field is non-empty; MAP shows only when
  both `sys` and `dia` are present.
- Deleting an event recomputes every derived value; deleting the earliest rhythm
  recomputes `initialRhythm` from the remaining rhythm events or to "unknown".

## Domain constants

```text
EPI_INTERVAL = 180s   AMIO_INTERVAL = 240s   CPR_CYCLE = 120s
RHYTHMS  = VF(shockable), pVT(shockable), PEA, Asystole, ROSC
AIRWAYS  = 無, 口咽 OPA, 聲門上 i-gel, 氣管內管 ETT
ETT_SIZES = 6.5, 7.0, 7.5, 8.0
DEFIB_JOULES = 150, 200, 250, 300, 360
```

## State transitions

```text
[App open] --auto--> Case(caseStart=now, events=[])
Case --giveEpi/giveAmio/logDefib/logIV/setRhythm/setAirway/addVitals/addNote--> Case(events += e)
Case --startCpr--> Case(cpr.startAt=now)               # cycles auto-roll via derivation
Case --declareROSC--> Case(rosc=now, events += rosc)   # clock keeps running
Case --declareArrival--> Case(arrived=now, events += arrival)
Case --removeEvent(id)--> Case(events -= id)           # all derivations update
Case --adjustStart(t)--> Case(caseStart=t)             # elapsed + offsets recompute
Case --newCase--> Case(reset)                          # after explicit confirm
every state change --> persist to localStorage (autosave)
```
