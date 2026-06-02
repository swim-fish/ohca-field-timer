# Phase 1 Data Model: Touch Ergonomics & AED Mode Improvements

This feature is overwhelmingly UI/interaction. It introduces **no new case entity** and
**no schema-version bump**: the AED outcome reuses the existing `rhythm` event. The only
new persisted datum is a single UI preference held outside the case record.

## Existing entities (unchanged shape)

- **CaseState** (`src/domain/types.ts`): `schemaVersion`, `caseStart`, `cpr`, `events[]`
  — unchanged. `schemaVersion` stays `1`.
- **OhcaEvent**: unchanged shape. The AED outcome is stored as a normal `rhythm` event
  using the existing fields:
  - `kind: 'rhythm'`
  - `label: '心律分析：可電擊 AED建議電擊'` (or `…不可電擊 AED不建議電擊`)
  - `rhythm: '可電擊 AED建議電擊' | '不可電擊 AED不建議電擊'`
    No new fields. `initialRhythm` / `lastRhythm` derive from `rhythm` exactly as today.

## New constant table

**`AED_OUTCOMES`** (`src/domain/constants.ts`) — parallel to the existing `RHYTHMS`:

| key     | label                    | shockable |
| ------- | ------------------------ | --------- |
| shock   | `可電擊 AED建議電擊`     | `true`    |
| noshock | `不可電擊 AED不建議電擊` | `false`   |

```ts
export interface AedOutcome {
  key: 'shock' | 'noshock';
  label: string;
  shockable: boolean;
}
export const AED_OUTCOMES: AedOutcome[] = [
  { key: 'shock', label: '可電擊 AED建議電擊', shockable: true },
  { key: 'noshock', label: '不可電擊 AED不建議電擊', shockable: false },
];
```

**Validation / invariants**:

- The `label` first token (`label.split(' ')[0]`) is `可電擊` / `不可電擊`, matching the
  existing summary "心律" cell logic — no derivation change.
- **Clinical guardrail (FR-016)**: a coarse outcome MUST NOT equal or map to any
  `RHYTHMS[].key`/specific rhythm; it is stored verbatim and never inferred to VF/pVT/etc.

## New preference entity

**RhythmMode preference** — a standalone, un-versioned UI preference, deliberately
separate from `CaseState` so a new case / case clear never resets it (FR-015).

| Attribute  | Type | Values                        | Default       | Storage                                                                                |
| ---------- | ---- | ----------------------------- | ------------- | -------------------------------------------------------------------------------------- |
| rhythmMode | enum | `'進階 ACLS'` \| `'簡易 AED'` | `'進階 ACLS'` | `localStorage` key `ohca.rhythmMode` (dot style, matching the existing `ohca.case.v1`) |

```ts
export type RhythmMode = '進階 ACLS' | '簡易 AED';
```

**Lifecycle / rules**:

- Read on mount; if absent or unrecognized → default `'進階 ACLS'`.
- Written whenever the operator flips the toggle (last-used wins).
- Independent of `schemaVersion`; corrupt/unknown values fall back to the default rather
  than throwing (offline robustness).
- Never cleared by `newCase()`.

## Transient UI state (not persisted)

- **TimelineRow swipe state**: `offsetX` (drag translate), `open` (latched), and the
  active pointer id. Local component state; never persisted.
- **Open-row coordination**: at most one row open at a time (FR-003) — a shared
  signal (context or a parent-held "openId") closes others; transient.
- **Viewport flag**: `wide: boolean` from `useViewport` (matchMedia). Derived from the
  environment, not stored.
- **Pending 已電擊 confirm**: after 建議電擊, a transient prompt; accepting calls
  `logDefib`, declining dismisses. Not persisted.

## Derivation impact

None. `derive.ts` (`initialRhythm`, `lastRhythm`, `shocks`, …) is unchanged: AED
outcomes are `rhythm` events and the 已電擊 shortcut produces an ordinary `defib` event,
so `shocks` counts it like any other shock. Deleting an AED-outcome rhythm event via the
new swipe behaves identically to deleting any rhythm event and recomputes
`initialRhythm` from the remaining rhythm events.

## Storage layout summary

| Store                | Key                           | Contents                                    | Versioned             | Cleared by newCase() |
| -------------------- | ----------------------------- | ------------------------------------------- | --------------------- | -------------------- |
| caseStore (existing) | `ohca.case.v1` (existing key) | `CaseState` incl. AED-outcome rhythm events | Yes (`schemaVersion`) | Yes                  |
| prefStore (new)      | `ohca.rhythmMode`             | `RhythmMode` string                         | No                    | No                   |
