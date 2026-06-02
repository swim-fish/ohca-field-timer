# State Contract: `useOHCA` hook

The application's logic contract is the `useOHCA` hook (ported to typed TypeScript
from `design-reference/project/ohca-core.jsx`). Components consume only this surface;
all derivations are pure and unit-tested independently.

## Hook signature

```ts
function useOHCA(opts?: {
  seedElapsed?: number; // seconds, for tests/demo
  seedEvents?: () => Event[]; // for tests/demo
  store?: CaseStore; // persistence port (default: localStorage)
}): OHCA;
```

## Returned surface (`OHCA`)

### Read state (derived; stable per render)

| Member                                         | Type                                        | Meaning                                        |
| ---------------------------------------------- | ------------------------------------------- | ---------------------------------------------- |
| `now`                                          | `Date`                                      | Current heartbeat time (updates ~1/s).         |
| `elapsedSec`                                   | `number`                                    | `floor((now - caseStart)/1000)`.               |
| `caseStart`                                    | `number`                                    | Case start timestamp (ms).                     |
| `rosc` / `arrived`                             | `number \| null`                            | Milestone timestamps.                          |
| `epi` / `amio`                                 | `{ count: number; lastAt: number \| null }` | Drug summaries.                                |
| `shocks`                                       | `number`                                    | Defib count.                                   |
| `ivDone`                                       | `boolean`                                   | IV/IO established.                             |
| `initialRhythm` / `lastRhythm`                 | `string \| null`                            | Rhythm summaries.                              |
| `airway`                                       | `{ type: string; size: string \| null }`    | Latest airway.                                 |
| `lastVitals`                                   | `Vitals \| null`                            | Latest vitals reading.                         |
| `events`                                       | `Event[]`                                   | Source of truth, newest-first.                 |
| `epiRemain` / `amioRemain` / `cprRemain`       | `number \| null`                            | Countdown seconds (may be ≤ 0 = due).          |
| `cprCycleNum`                                  | `number`                                    | Current CPR cycle (1-based; 0 if not started). |
| `cprActive`                                    | `boolean`                                   | CPR cycle running.                             |
| `EPI_INTERVAL` / `AMIO_INTERVAL` / `CPR_CYCLE` | `number`                                    | 180 / 240 / 120.                               |

### Actions (`o.actions`)

| Action                             | Effect                                                   | Requirement |
| ---------------------------------- | -------------------------------------------------------- | ----------- |
| `giveEpi(at?)`                     | push `epi` event, dose-numbered from prior list          | FR-003      |
| `giveAmio(at?)`                    | push `amio` event, dose-numbered                         | FR-004      |
| `logDefib(at?, joules?)`           | push `defib` event with energy (default 200)             | FR-005      |
| `logIV(at?)`                       | push `iv` event                                          | FR-006      |
| `setRhythm(label, at?)`            | push `rhythm` event                                      | FR-007      |
| `setAirwayDevice(type, size, at?)` | push `airway` event                                      | FR-008      |
| `addVitals(vitals, at?)`           | push `vitals` event with derived MAP + detail line       | FR-009/010  |
| `addNote(label, at?)`              | push `note` event (ignored if empty)                     | FR-012      |
| `startCpr()`                       | set `cpr.startAt = now`                                  | FR-002      |
| `declareROSC()`                    | set `rosc`, push `rosc` event; clock keeps running       | FR-014      |
| `declareArrival()`                 | set `arrived`, push `arrival` event; clock keeps running | FR-014      |
| `adjustStart(at)`                  | set `caseStart = at`; elapsed + offsets recompute        | FR-001      |
| `newCase()`                        | reset all state after caller confirms                    | FR-015      |
| `removeEvent(id)`                  | drop event; all derivations update                       | FR-013/016  |

## Invariants (test these)

1. **Derived consistency (FR-016)**: after any action or `removeEvent`, every
   summary equals a fresh recomputation from `events`.
2. **Reminder, not lock**: `giveEpi`/`giveAmio` succeed regardless of `*Remain`;
   the new dose resets the countdown.
3. **Due semantics**: `epiRemain <= 0` ⇒ tile due; before first dose `epiRemain` is
   `null` ⇒ not due.
4. **Clock independence (FR-014)**: `declareROSC`/`declareArrival` do not alter
   `caseStart`; `elapsedSec` keeps advancing.
5. **CPR cycle math (FR-002)**: at `t` seconds after `startCpr`, `cprCycleNum =
floor(t/120)+1` and `cprRemain = 120 - (t mod 120)`.
6. **MAP (FR-009)**: `map = round(dia + (sys - dia)/3)` when both present, else `null`.
7. **Persistence (FR-020)**: every state change writes to the store; constructing
   the hook with a populated store restores identical derived state.

## Persistence port (`CaseStore`)

```ts
interface CaseStore {
  load(): CaseState | null; // null if absent/unreadable
  save(state: CaseState): void;
  clear(): void;
}
```

Default implementation wraps `localStorage` with JSON + `schemaVersion`, tolerant of
absence/quota/private-mode failures (no throw on save failure — degrade gracefully).
