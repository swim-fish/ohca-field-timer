# Responsive Layout Contract: Portrait → Landscape/Wide

Behaviour contract for the adaptive layout (FR-009..FR-011). Driven by a viewport flag
from `useViewport` (matchMedia), not by device sniffing.

## Breakpoints

| Flag | Condition (matchMedia) | Layout |
|------|------------------------|--------|
| `wide = false` | default / phone portrait / narrow | Current single scrolling column (unchanged from feature 001) |
| `wide = true` | `(min-width: 900px) and (orientation: landscape)` **or** `(min-width: 1000px)` | Two-zone grid (see below) |

> Exact pixel breakpoints are tunable in implementation; the contract is the two states
> and their invariants, not the specific px values.

## Zone composition when `wide = true`

| Zone | Contents |
|------|----------|
| Primary (left / main) | CommandBar (elapsed clock, status, start-time adjust), CprBar, status buttons (ROSC/arrival/new case), action tiles (Epi/Amio/Defib/IV/Rhythm/Airway), VitalsHUD, 處置摘要 / StatsStrip |
| Timeline (right / side) | 處置時間軸 (Timeline) persistently visible alongside the primary zone |

Same components, re-parented — **no** duplicated logic or state.

## Invariants

| ID | Contract | FR |
|----|----------|----|
| RL-1 | In `wide`, primary areas + timeline are all visible without horizontal scrolling, clipped content, or large empty gutters | FR-009 |
| RL-2 | Portrait keeps the exact current single-column layout and ordering | FR-009 |
| RL-3 | In every state, all touch targets keep the §2 floor (≥56×56, ≥8 px) and the layout stays touch-first (not pointer-dense) | FR-010 |
| RL-4 | Switching `wide` ⇄ not (rotation/resize) mid-case preserves all case-derived values (elapsed, counts, timeline contents) with zero data loss | FR-011 |
| RL-5 | The timeline in the side zone retains the swipe-to-delete behaviour from the interaction contract | FR-001 |
| RL-6 | No content overlap or clipping at extreme narrow or extreme wide widths | Edge case |

## Why state survives rotation (RL-4)

All case state lives in the `useOHCA` hook held by `App`; layout zones are presentational
children. Re-parenting children on a `wide` change does not unmount `App`, so React
preserves hook state — elapsed time and all derived counts are continuous across the
switch. Tests assert derived values are equal immediately before and after a simulated
matchMedia change.

## Test approach

- Mock `window.matchMedia` in `tests/setup.ts`.
- `wide=false`: assert single-column ordering and that the timeline renders after the
  main content.
- `wide=true`: assert the timeline renders within the persistent side zone.
- Fire a matchMedia change `false→true` mid-"case" (seeded events) and assert
  `elapsedSec`, `shocks`, `epi.count`, and timeline length are unchanged.
