# ADR 0002: Derived state from a single events array

- **Status**: Accepted
- **Date**: 2026-06-02
- **Feature**: 001-tactical-hud-timer

## Context

The HUD shows many summaries — drug/shock counts, initial/last rhythm, airway, last
vitals, drug countdowns — that must always agree with the treatment timeline, including
after a long-press delete (FR-016). Timers must stay accurate across reload, background,
and screen lock on mobile (FR-001, FR-020, SC-008).

## Decision

- The **single source of truth is the `events` array** plus two timer anchors
  (`caseStart`, `cpr.startAt`). Every summary is a **pure derivation**
  (`src/domain/derive.ts`) recomputed from `events`; nothing is stored twice.
- **ROSC and hospital-arrival are derived from the latest `rosc` / `arrival` events**,
  not stored as separate anchors. This is deliberate: storing them separately would let a
  timeline delete (long-press) desync the status indicator from the log — a rescuer
  correcting a mis-tapped ROSC must be able to revert the status, and deriving it makes
  that automatic.
- **Elapsed time and all countdowns derive from wall-clock timestamps** (`now - anchor`),
  computed off a single 1-second heartbeat. Ticks are never accumulated, so a
  throttled/locked tab loses no time when it resumes.
- **State autosaves to a `CaseStore`** (localStorage adapter) on every change and restores
  on load; the store degrades silently if storage is unavailable.
- The hook `useOHCA` exposes read state + `actions`; components are thin and stateless
  about domain logic.

## Consequences

- Adding or deleting any event updates the entire UI consistently for free.
- Domain logic (derivations, countdowns, MAP, persistence) is pure and unit-testable in
  isolation — 25 unit tests cover it without rendering React.
- The persistence shape is versioned (`schemaVersion`) for future migration.

## Alternatives considered

- **Storing counts/summaries alongside events** — rejected: invites drift and makes
  delete error-prone.
- **Accumulating elapsed seconds on each tick** — rejected: drifts and loses time when the
  tab is backgrounded or the device is locked (a critical field failure mode).
