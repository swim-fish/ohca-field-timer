# ADR 0006: Code-review outcomes for feature 002 (touch UX & AED mode)

- **Status**: Accepted
- **Date**: 2026-06-03
- **Feature**: 002-touch-ux-aed-mode

## Context

Per constitution Principle VI, the feature-002 implementation was reviewed at high
effort (7 finder angles + verifiers). This ADR records what was fixed and what was
deliberately accepted, so the decisions are traceable (Principle V). See ADR-0004
(swipe-delete) and ADR-0005 (AED coarse-rhythm mode) for the design rationale.

## Fixed in this review

- **HIGH — bounce guard coverage (FR-008)**: `useTapGuard` was only on `TacTile`, so the
  AED `已電擊` shortcut and the `DefibSheet` energy buttons could double-log a shock on a
  gloved double-contact. The guard was extended to those action-logging controls, using
  an independent guard instance per control so a `建議電擊 → 已電擊` sequence is never
  cross-dropped. ROSC/arrival remain idempotent via their own once-only checks.
  Regression test: "a gloved double-contact on 已電擊 logs only one shock".
- **MEDIUM — open delete control not auto-closed**: logging a new event left a previously
  swiped-open row armed, contrary to the spec edge case. `Timeline` now closes any open
  control when the event set changes. Regression test: "logging a new event closes any
  open delete control".
- **MEDIUM — touch floor scattered / not centralized**: the `--ohca-touch-min` token
  existed but most controls hard-coded `56`. Introduced `src/theme/touch.ts`
  (`TOUCH_MIN` / `TOUCH_GAP`) as the single TS source of truth, consumed by Seg,
  StatusBtn, NumPad, ThemeToggle, RhythmPicker, and TimelineRow; the CSS token is the
  documented CSS-land mirror and the dead `.ohca-touchable` helper concern is resolved.
- **MEDIUM — duplicated mode list**: `RHYTHM_MODES` is now defined once in `constants.ts`
  and imported by both `RhythmPicker` and `prefStore`, so a drift can no longer make
  prefStore treat a valid mode as corrupt and silently reset the remembered choice.
- **LOW — `safeLocalStorage()` duplication**: extracted to
  `src/persistence/safeStorage.ts`, shared by `caseStore` and `prefStore`.
- **LOW — App layout duplication**: the wide/narrow branches were collapsed into one
  return sharing `CommandBar` and the sheets; only the body wrapper differs.
- **LOW — TimelineRow resting-offset repetition**: extracted `restingOffset`.
- **LOW — useViewport redundant mount render**: removed the eager `onChange()` call (the
  `useState` lazy initializer already seeds the value).

## Accepted / deferred (with rationale)

- **70 ms bounce window (FR-008)**: the guard is time-keyed. 70 ms sits well below a
  deliberate double-tap cadence, so genuine spaced taps still register while true contact
  bounce is filtered. Per-control instances keep the window from interfering across
  controls. Accepted as the right trade-off for a field tool.
- **`useTapGuard` `useCallback` memoization**: a review candidate claimed the memo was
  invalidated each render by the default `now = Date.now` parameter. Re-examined and
  **refuted** — `Date.now` is a stable reference, so the dependency array is stable and
  the memo holds. No change.
- **Numeric keypad not bounce-guarded**: keypad keys do text entry (capped length), not
  action logging, so a double-press is a benign extra digit, not a double-counted
  clinical action. Out of scope for FR-008. Accepted.
- **Transient swipe/open UI state reset on rotation**: switching wide↔narrow re-parents
  the tree, resetting an in-progress swipe or armed delete. Case data lives in `useOHCA`
  and is preserved (FR-011); losing transient gesture state on a deliberate rotation is
  acceptable.

## Consequences

The two real correctness items (shock double-log via the AED shortcut; stale open delete
control) are fixed and covered by regression tests (74 tests total, all passing). The
remaining changes centralize the touch floor and the mode list, removing drift risk. No
new runtime dependency; production build unchanged (JS gzip ~56 KB, within budget).
