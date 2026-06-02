# Implementation Plan: Touch Ergonomics & AED Mode Improvements

**Branch**: `002-touch-ux-aed-mode` | **Date**: 2026-06-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-touch-ux-aed-mode/spec.md`

## Summary

A focused UX increment on top of the existing **Tactical HUD OHCA Field Timer**
(`001-tactical-hud-timer`). Four changes: (1) replace the long-press timeline-entry
delete with a swipe-to-reveal delete button; (2) enforce a glove-friendly touch
floor (≥56×56 CSS px, ≥8 px spacing) across every interactive control; (3) make the
layout adaptive — keep the current single column in phone portrait, reflow into a
multi-zone layout (timers/actions alongside a persistent timeline) in landscape and on
wide viewports; (4) add a 進階 ACLS ⇄ 簡易 AED toggle to the rhythm-analysis sheet that
records a coarse 可電擊/不可電擊 outcome with a one-tap 已電擊 shortcut, defaulting to
進階 ACLS and remembering the last-used mode. No backend, no new data store — the
single events array stays the source of truth and the AED outcome is an ordinary
`rhythm` event. Technical approach unchanged from feature 001: TypeScript strict +
React 18 + Vite, vite-plugin-pwa, localStorage, Vitest + React Testing Library under
TDD, Prettier.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict` mode (constitution Principle I); React 18

**Primary Dependencies**: Existing only — React 18 + react-dom, Vite, vite-plugin-pwa;
dev: Vitest, @testing-library/react, @testing-library/user-event, jsdom, Prettier. No
new runtime dependencies (swipe, responsive layout, and the AED toggle are built from
pointer events, CSS, and existing primitives — see research.md).

**Storage**: Browser `localStorage`. Adds one small standalone preference key for the
rhythm-analysis mode (`ohca.rhythmMode`), kept separate from the versioned case state so
a case clear never resets the operator's mode choice (data-model.md).

**Testing**: Vitest + React Testing Library (jsdom). Swipe gestures exercised via
`@testing-library/user-event` / `fireEvent` pointer events; responsive reflow via a
mocked `matchMedia`; preference persistence and AED-outcome derivation as unit tests.
TDD red-green-refactor mandatory (Principle II).

**Target Platform**: Modern mobile browsers as an installable PWA, now explicitly
including landscape phones, tablets, and mounted field touchscreens. Static hosting on
GitHub Pages (unchanged).

**Project Type**: Single-project offline-first web app (SPA/PWA) — extends the existing
structure; no new project.

**Performance Goals**: Inherit feature 001 budgets (TTI < 2s over cache; gzip app-code
budget ≤ 150 KB; 1s clock tick, zero perceptible drift over 60 min). Swipe interaction
feedback MUST be perceptibly immediate (no dropped frames during the drag); the
responsive reflow MUST not introduce layout thrash on rotation.

**Constraints**: Offline behaviour and case persistence unchanged (FR-019/020 of 001
preserved); all new UI text in Traditional Chinese (FR-017); dark theme default
(FR-017 of 001); glove-friendly touch floor 56×56 px / ≥8 px (FR-006); rotation/resize
mid-case preserves state (FR-011); AED coarse outcome never inferred to a specific
rhythm (FR-016, clinical guardrail).

**Scale/Scope**: Single active case; tens to low-hundreds of timeline events. No
multi-user, no concurrency. Scope is UI/interaction + one persisted preference + one
constant table (`AED_OUTCOMES`); domain timing logic is untouched.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                          | Gate                                                                              | Status                                                                                                                                  |
| ---------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| I. Code Quality & Consistent Style | TS `strict`, no untyped `any`; Prettier `--check` + format hook                   | PASS — changes are typed React/TS in the existing style; no new `any`; Prettier already wired                                           |
| II. Test-First Development         | TDD red-green-refactor; tests fail before implementation                          | PASS — swipe-delete, touch-floor, responsive reflow, AED-outcome recording, defib shortcut, and mode persistence are all test-first    |
| III. User Experience Consistency   | Consistent interaction/terminology; UI changes documented in `docs/ui/`           | PASS — `docs/ui/tactical-hud.md` updated for swipe-delete, touch floor, responsive layout, and AED toggle in the same change set        |
| IV. Performance & Offline-First    | Offline PWA; explicit, measurable budgets verified                                | PASS — no new deps; offline shell untouched; 001 budgets inherited and swipe/reflow frame budgets declared above                        |
| V. Documentation Discipline        | English docs; ADRs; update ADRs after analyze/implement                           | PASS — new ADRs seeded (swipe-delete-over-long-press; AED coarse-outcome rhythm mode); ADR review remains a standing post-implement task |
| VI. Subagent-Driven Workflow       | Splittable work delegated; mixed-model review                                     | PASS — independent stories (swipe / touch-floor / responsive / AED) are parallelizable; code review by a mixed Sonnet+Opus panel        |

**Initial Constitution Check: PASS** — no violations; Complexity Tracking not required.

**Post-Design Constitution Check (after Phase 1): PASS** — the design adds no new
project, no new runtime dependency, and no new persistence layer beyond a single small
preference key intentionally kept separate from case state. The AED outcome reuses the
existing `rhythm` event kind (no schema bump), honouring the single-source-of-truth
principle and the clinical guardrail. Complexity Tracking remains empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-touch-ux-aed-mode/
├── plan.md              # This file (/speckit-plan output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (technique decisions)
├── data-model.md        # Phase 1 output (entities, preference, derivations)
├── quickstart.md        # Phase 1 output (run, test, verify the four changes)
├── contracts/           # Phase 1 output
│   ├── interaction-contract.md   # swipe-delete + touch-floor + AED-toggle behaviour
│   └── responsive-contract.md    # breakpoints, zones, rotation invariants
├── checklists/
│   └── requirements.md  # Spec quality checklist (passing)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

Changes are localized to existing files plus a few small additions. Unchanged modules
from feature 001 are omitted for brevity.

```text
src/
├── App.tsx                       # CHANGED: adaptive layout zones; timeline hint text
│                                 #   "長按項目可刪除" → "滑動項目可刪除"; pass rhythm mode
├── domain/
│   ├── constants.ts              # CHANGED: add AED_OUTCOMES (可電擊/不可電擊, shockable)
│   └── types.ts                  # CHANGED (optional): RhythmMode = '進階 ACLS' | '簡易 AED'
├── persistence/
│   └── prefStore.ts              # NEW: standalone localStorage preference (rhythm mode)
├── hooks/
│   ├── useRhythmMode.ts          # NEW: read/persist remembered rhythm-analysis mode
│   └── useViewport.ts            # NEW: matchMedia-based portrait/landscape+wide flag
├── components/
│   ├── TimelineRow.tsx           # CHANGED: swipe-to-reveal delete (replaces long-press)
│   ├── RhythmPicker.tsx          # CHANGED: 進階 ACLS ⇄ 簡易 AED toggle + AED buttons
│   │                             #   + one-tap 已電擊 shortcut wiring
│   ├── TacTile.tsx               # CHANGED (if needed): confirm ≥56px touch floor
│   ├── DefibSheet.tsx            # (touch-floor audit only; energy picker unchanged)
│   ├── NumPad.tsx                # CHANGED (if needed): keys ≥56×56, ≥8px spacing
│   ├── Seg.tsx                   # CHANGED (if needed): add a glove-friendly size for toggle
│   ├── StatusBtn.tsx             # touch-floor audit
│   └── ThemeToggle.tsx           # touch-floor audit
└── styles/
    └── global.css                # CHANGED: responsive layout, touch-target utilities

tests/
├── unit/
│   ├── prefStore.test.ts         # NEW: preference persistence + default
│   └── aedOutcomes.test.ts       # NEW: coarse outcome recorded, never back-mapped
├── component/
│   ├── timelineSwipeDelete.test.tsx  # NEW: swipe reveals/deletes; partial snaps back; one-open
│   ├── rhythmAedMode.test.tsx        # NEW: toggle, AED buttons, 已電擊 shortcut, remembered mode
│   ├── responsiveLayout.test.tsx     # NEW: portrait single-col vs landscape multi-zone (matchMedia)
│   └── touchTargets.test.tsx         # NEW: primary controls meet 56×56 / ≥8px floor
└── setup.ts                      # CHANGED (if needed): matchMedia + pointer-event polyfills

docs/
├── ui/
│   └── tactical-hud.md           # CHANGED: document swipe-delete, touch floor, responsive, AED toggle
├── adr/
│   ├── 0004-swipe-delete-over-long-press.md   # NEW
│   └── 0005-aed-coarse-rhythm-mode.md         # NEW
└── backlog/
    └── aed-simplified-rhythm.md  # source agreement for the AED story (mark as realized)
```

**Structure Decision**: Extend the existing single-project web app. Domain/timer logic
in `src/domain` is untouched except for the additive `AED_OUTCOMES` table; the AED
outcome flows through the existing `setRhythm` action and `rhythm` event kind, so no
schema-version bump and no change to derivations. New cross-cutting concerns get small
isolated modules — a standalone `prefStore`/`useRhythmMode` (kept apart from case state
per FR-015) and a `useViewport` hook for the responsive flag — keeping components thin
and the new behaviour unit-testable in isolation, mirroring feature 001's logic/UI split.

## Complexity Tracking

> No constitution violations — this section is intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| —         | —          | —                                    |
