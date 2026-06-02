# ADR 0003: Mixed-model code-review outcomes and accepted trade-offs

- **Status**: Accepted
- **Date**: 2026-06-02
- **Feature**: 001-tactical-hud-timer

## Context

Per constitution Principle VI, the implementation was reviewed by a mixed Sonnet + Opus
subagent panel. This ADR records what was fixed and what was deliberately deferred or
accepted, so the decisions are traceable (Principle V).

## Fixed in this feature

- **CRITICAL — ROSC/arrival dual source of truth**: milestones were stored both as
  timestamps and as events; deleting the timeline event left the status indicator stuck.
  Fixed by deriving `rosc`/`arrived` from the latest `rosc`/`arrival` events (see
  ADR-0002). Regression test: "deleting the ROSC timeline entry reverts the status".
- **HIGH — action timestamps bypassed the injected `nowFn`**: all actions now route
  through `nowFn`, restoring a single clock seam.
- **MEDIUM — event id collision after reload**: ids now carry a per-session random base
  so a reset counter cannot collide with pre-reload ids.
- **MEDIUM — `pushEvent` treated `at = 0` as falsy** (`||` → `??`).
- **MEDIUM — schemaVersion**: `load()` now refuses a store newer than the current schema
  instead of mis-deriving it.
- **MEDIUM — timeline delete button could not be dismissed**: moving off the row disarms it.
- **LOW — duplicated interval constants and unnecessary non-null assertions** removed.
- **Test gaps** closed: `adjustStart`, Amiodarone, reminder-not-a-lock, airway+ETT,
  rhythm/ROSC delete derivations, early-release long-press (48 tests total).

## Accepted / deferred (with rationale)

- **Dose-label numbering after a delete** (e.g., deleting an earlier Epi dose): the label
  records what was logged at that time and is historical; the live `epi.count` stat is
  correctly derived. Renumbering history on delete is arguably wrong, so labels are left
  as-is. Accepted, matches the reference design.
- **Future `caseStart` / negative elapsed from a device-clock or DST change**: the only UI
  path adjusts the start to "minutes ago", so `caseStart ≤ now` in normal use. Surfacing a
  "check device clock" warning for the rare backward-clock case is **deferred** as a
  follow-up; today such a value is clamped to `00:00` by `fmtElapsed`.
- **Service worker `registerType: 'autoUpdate'`**: chosen so a stale/dangerous cache cannot
  linger in a field tool. A mid-case reload is non-destructive because the case is persisted
  and restored (FR-020). A user-prompted update flow is a possible future refinement.

## Consequences

The clinically-significant defect (lying status indicator) is eliminated and covered by a
regression test. Remaining items are low-likelihood edge cases documented for follow-up
rather than silently ignored.
