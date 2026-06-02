# Implementation Plan: Tactical HUD OHCA Field Timer

**Branch**: `001-tactical-hud-timer` | **Date**: 2026-06-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-tactical-hud-timer/spec.md`

## Summary

Recreate the **Direction A · Tactical HUD** design as a production, offline-first
Progressive Web App: a single-case OHCA (out-of-hospital cardiac arrest) field
timer for emergency rescuers. The app shows a master elapsed clock, a CPR 2-minute
cycle cue, one-tap drug/shock logging with interval reminders (Epinephrine 3 min,
Amiodarone 4 min), rhythm/airway/IV/vitals capture via a gloved-hand numeric
keypad, a live reverse-chronological treatment timeline with long-press delete, and
ROSC/arrival milestones — all derived from a single events array (single source of
truth). Technical approach: TypeScript + React 18 built with Vite, PWA via
vite-plugin-pwa (Workbox), localStorage persistence with timestamp-derived timing
for background accuracy, Vitest + React Testing Library under strict TDD, Prettier-
enforced formatting, deployed to GitHub Pages via GitHub Actions.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict` mode (constitution Principle I); React 18

**Primary Dependencies**: React 18 + react-dom, Vite (build/dev), vite-plugin-pwa
(Workbox service worker + manifest); dev: Vitest, @testing-library/react,
@testing-library/user-event, jsdom, Prettier

**Storage**: Browser `localStorage` (single case state serialized as JSON — small,
one events array). No backend, no network storage. See research.md.

**Testing**: Vitest + React Testing Library (jsdom), Vitest fake timers for
time-based logic. TDD red-green-refactor mandatory (constitution Principle II).

**Target Platform**: Modern mobile browsers (iOS Safari, Android Chrome) as an
installable PWA; responsive but phone-first. Static hosting on GitHub Pages.

**Project Type**: Single-project web application (offline-first SPA/PWA).

**Performance Goals**: Time-to-interactive < 2s on a mid-range phone over the cache
after first load (SC-001); JS bundle (gzipped) budget ≤ 150 KB app code; 1-second
clock tick with zero perceptible drift over a 60-minute case (SC-008) — achieved by
deriving elapsed time from a stored wall-clock timestamp, not tick accumulation.

**Constraints**: Fully functional offline after first load (FR-019); in-progress
case persisted and restored across reload/background/relaunch (FR-020); correct
Vite `base` path for the GitHub Pages project subpath; all UI text in Traditional
Chinese (FR-021); dark theme default (FR-017).

**Scale/Scope**: Single active case at a time; one rescuer/device; on the order of
tens to low-hundreds of timeline events per case. No multi-user, no concurrency.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                          | Gate                                                                                                       | Status                                                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| I. Code Quality & Consistent Style | TypeScript `strict`, no untyped `any`; Prettier `--check` + auto-format hook enforced in CI and pre-commit | PASS — stack is TS strict; Prettier config + format script + hook are explicit tasks                          |
| II. Test-First Development         | TDD red-green-refactor; tests written and failing before implementation                                    | PASS — Vitest+RTL chosen; tasks ordered tests-first; derivations/countdowns/persistence/MAP are unit-testable |
| III. User Experience Consistency   | Consistent interaction/terminology; UI changes documented in `docs/ui/`                                    | PASS — recreating one cohesive design; `docs/ui/tactical-hud.md` is a Phase 1 deliverable                     |
| IV. Performance & Offline-First    | Offline PWA; explicit, measurable performance budgets verified                                             | PASS — vite-plugin-pwa offline shell; budgets declared above and in research.md                               |
| V. Documentation Discipline        | English docs; ADRs; update ADRs after analyze/implement                                                    | PASS — `docs/adr/` seeded in Phase 1; ADR update is a standing task post-implement                            |
| VI. Subagent-Driven Workflow       | Splittable work delegated; Sonnet for simple, mixed Sonnet+Opus for review                                 | PASS — research delegated to a Sonnet subagent; code review to a mixed panel (planned)                        |

**Initial Constitution Check: PASS** — no violations; Complexity Tracking not required.

**Post-Design Constitution Check (after Phase 1): PASS** — design introduces no new
projects, no extra persistence layers, and no principle violations. The architecture
(single derived-state store, localStorage, static PWA) is the simplest that meets
the requirements. Complexity Tracking remains empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-tactical-hud-timer/
├── plan.md              # This file (/speckit-plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (technology decisions)
├── data-model.md        # Phase 1 output (entities & derivations)
├── quickstart.md        # Phase 1 output (setup, run, test, deploy)
├── contracts/           # Phase 1 output (state & UI behavior contracts)
│   ├── state-contract.md
│   └── ui-contract.md
├── checklists/
│   └── requirements.md  # Spec quality checklist (passing)
├── design-reference/    # Preserved Claude Design handoff bundle (source of truth for visuals)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
index.html               # Vite entry (app shell, font preconnect/links)
vite.config.ts           # Vite + vite-plugin-pwa (manifest, Workbox) + base path
vitest.config.ts         # jsdom env, setup file
tsconfig.json            # strict TypeScript
.prettierrc / .prettierignore
public/
├── icons/               # PWA icons (192/512, maskable)
└── manifest assets

src/
├── main.tsx             # React root + service worker registration
├── App.tsx              # OHCATactical screen composition
├── domain/
│   ├── types.ts         # Event, Vitals, CaseState, EventKind, Rhythm, Airway types
│   ├── constants.ts     # RHYTHMS, AIRWAYS, ETT_SIZES, intervals, EVENT_META
│   ├── derive.ts        # pure derivations from events (counts, rhythm, airway, vitals)
│   ├── format.ts        # fmtElapsed, fmtClock, fmtTimeOfDay, pad2, mapOf (MAP)
│   └── useOHCA.ts        # the brain: typed state hook (events SoT + timers)
├── persistence/
│   └── caseStore.ts      # localStorage load/save/clear (autosave), schema-versioned
├── theme/
│   ├── tokens.ts         # dark/light theme token objects
│   └── useTheme.ts
├── components/
│   ├── CommandBar.tsx    # elapsed clock, status, start-time adjust
│   ├── CprBar.tsx        # 2-min cycle countdown + warning
│   ├── StatusBtn.tsx     # ROSC / arrival / new case
│   ├── TacTile.tsx       # drug/action tiles (Epi/Amio/Defib/IV/Rhythm/Airway)
│   ├── VitalsHUD.tsx     # vitals grid + MAP + ECG note + commit
│   ├── NumPad.tsx        # numeric keypad sheet
│   ├── Sheet.tsx         # bottom sheet
│   ├── Seg.tsx           # segmented control (ETT size)
│   ├── RhythmPicker.tsx
│   ├── AirwayPicker.tsx
│   ├── DefibSheet.tsx
│   ├── StatsStrip.tsx    # shocks/Epi/Amio/rhythm mini-stats
│   ├── Timeline.tsx      # treatment timeline list
│   └── TimelineRow.tsx   # one entry + long-press delete
└── styles/
    └── global.css        # font vars, resets

tests/
├── unit/                # derive, format/MAP, countdowns, persistence (fake timers)
├── component/           # tiles, numpad entry, timeline delete, vitals commit
└── setup.ts

docs/
├── ui/
│   └── tactical-hud.md  # UI design doc (Principle III)
└── adr/
    ├── 0001-tech-stack-vite-react-ts-pwa.md
    └── 0002-derived-state-single-source-of-truth.md

.github/workflows/
└── deploy.yml           # build + deploy to GitHub Pages
```

**Structure Decision**: Single-project web app (Option 1). The domain logic
(`src/domain`) is deliberately separated from React components so the time/derivation
logic is unit-testable in isolation (TDD, Principle II) and the components stay thin.
Persistence and theme are isolated modules. This mirrors the prototype's clean split
between `ohca-core.jsx` (logic/atoms) and `variant-tactical.jsx` (layout).

## Complexity Tracking

> No constitution violations — this section is intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| —         | —          | —                                    |
