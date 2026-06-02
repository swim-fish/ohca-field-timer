---
description: "Task list for Tactical HUD OHCA Field Timer implementation"
---

# Tasks: Tactical HUD OHCA Field Timer

**Input**: Design documents from `/specs/001-tactical-hud-timer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test tasks are INCLUDED and ordered first — the project constitution
(Principle II) makes TDD non-negotiable: write the test, watch it fail, then implement.

**Organization**: Tasks are grouped by user story. Priority order from spec.md:
P1 = US1, US2, US6; P2 = US3, US4, US5.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US6 for user-story phases; Setup/Foundational/Polish carry no story label
- Single-project web app: source at `src/`, tests at `tests/` (repo root)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, tooling, and PWA/CI scaffolding

- [x] T001 Initialize Vite + React 18 + TypeScript project at repo root (`package.json` with dev/build/preview/test/test:run/coverage/format/format:check scripts, React 18 + react-dom deps)
- [x] T002 [P] Configure strict TypeScript in `tsconfig.json` (`strict: true`, no implicit any, bundler module resolution)
- [x] T003 [P] Configure Prettier in `.prettierrc` and `.prettierignore`; wire `format` (write) and `format:check` scripts
- [x] T004 [P] Configure Vitest in `vitest.config.ts` (jsdom env, globals) and `tests/setup.ts` (`@testing-library/jest-dom`)
- [x] T005 [P] Configure Vite + `vite-plugin-pwa` in `vite.config.ts` with `base: '/ohca-field-timer/'` and manifest scaffold (registerType autoUpdate)
- [x] T006 [P] Create app shell `index.html` and `src/styles/global.css` (font preconnect + Noto Sans TC / JetBrains Mono, `--ohca-sans`/`--ohca-mono` vars, resets)
- [x] T007 [P] Add PWA icons (192, 512, maskable) under `public/icons/`
- [x] T008 [P] Create GitHub Actions workflow `.github/workflows/deploy.yml` (install → format:check → test:run → build → upload `dist/` → deploy Pages) and `public/404.html` SPA fallback
- [x] T009 [P] Create `src/` folder structure with empty module stubs per plan.md (domain/, persistence/, theme/, components/)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared domain core, persistence, theme, and atoms that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests (write first, must fail)

- [x] T010 [P] Unit tests for format utils (fmtElapsed, fmtClock, fmtTimeOfDay, pad2, mapOf) in `tests/unit/format.test.ts`
- [x] T011 [P] Unit tests for event derivations (counts, initialRhythm/lastRhythm, airway, lastVitals, ivDone) in `tests/unit/derive.test.ts`
- [x] T012 [P] Unit tests for `CaseStore` localStorage adapter (load/save/clear, absent + unreadable + save-failure degrade) in `tests/unit/caseStore.test.ts`

### Implementation

- [x] T013 [P] Domain types (Event, EventKind union, Vitals, CaseState, OHCA) in `src/domain/types.ts`
- [x] T014 [P] Domain constants (RHYTHMS, AIRWAYS, ETT_SIZES, DEFIB_JOULES, EPI/AMIO/CPR intervals, EVENT_META colors) in `src/domain/constants.ts`
- [x] T015 Implement format utils in `src/domain/format.ts` (makes T010 pass; T010 MUST include an `fmtElapsed` case for a >60-minute case rendering `h:mm:ss` — FR-001 / Edge Cases)
- [x] T016 Implement pure derivations in `src/domain/derive.ts` (makes T011 pass)
- [x] T017 Implement localStorage `CaseStore` (JSON + schemaVersion, graceful failure) in `src/persistence/caseStore.ts` (makes T012 pass)
- [x] T018 [P] Theme tokens (dark/light) in `src/theme/tokens.ts` and `useTheme` in `src/theme/useTheme.ts`
- [x] T019 Implement `useOHCA` hook core in `src/domain/useOHCA.ts` (1s heartbeat, events source-of-truth, push/removeEvent, autosave to + restore from CaseStore)
- [x] T020 [P] Shared atoms (`Sheet`, `NumPad`, `Seg`, `ThemeToggle`) in `src/components/`
- [x] T021 React root + service-worker registration in `src/main.tsx` and `App.tsx` scaffold (theme provider, scroll column)

**Checkpoint**: Domain core tested and green; UI shell renders — stories can begin

---

## Phase 3: User Story 1 - Elapsed time & CPR cycles (Priority: P1) 🎯 MVP

**Goal**: Master elapsed clock (auto-start, adjustable) + CPR 2-minute cycle cue

**Independent Test**: Open app → clock counts up; start CPR → counts down from 2:00,
warns ≤15s, rolls to next cycle with incremented number; adjust start time → elapsed recomputes

### Tests (write first, must fail)

- [x] T022 [P] [US1] Unit tests for CPR cycle math (cprRemain, cprCycleNum, auto roll-over) with vitest fake timers in `tests/unit/cpr.test.ts`
- [x] T023 [P] [US1] Unit tests for elapsed + `adjustStart` recompute of offsets in `tests/unit/elapsed.test.ts`
- [x] T024 [P] [US1] Component test for `CommandBar` (clock advances, start-time adjust, theme toggle switches dark/light tokens — FR-017, and a >60-min elapsed value renders `h:mm:ss` without breaking layout — M1) in `tests/component/commandBar.test.tsx`
- [x] T025 [P] [US1] Component test for `CprBar` (start, countdown, ≤15s warning, roll-over) in `tests/component/cprBar.test.tsx`

### Implementation

- [x] T026 [US1] Add `startCpr`, `adjustStart` actions and cpr/elapsed derivations to `src/domain/useOHCA.ts`
- [x] T027 [US1] Implement `CommandBar.tsx` in `src/components/` (status dot/label, elapsed clock, time-of-day, start-time adjust sheet, theme toggle)
- [x] T028 [US1] Implement `CprBar.tsx` in `src/components/` (start button, mono countdown, progress bar, ⚠ 準備換手 warning)
- [x] T029 [US1] Compose CommandBar + CprBar into `App.tsx`

**Checkpoint**: US1 independently functional — a usable minimal resuscitation timer

---

## Phase 4: User Story 2 - Drugs & shocks with interval reminders (Priority: P1)

**Goal**: One-tap Epinephrine/Amiodarone/Defib logging with countdowns and due cues

**Independent Test**: Tap Epi → count+1, 3:00 countdown; let it hit 0 → "可給藥" pulse;
tap Defib → pick energy → shock count+1

### Tests (write first, must fail)

- [x] T030 [P] [US2] Unit tests for drug countdowns + due semantics (epiRemain/amioRemain null-before-first, ≤0 due) fake timers in `tests/unit/drugs.test.ts`
- [x] T031 [P] [US2] Component test for drug `TacTile` (tap logs, count, countdown text, due pulse) in `tests/component/tacTile.test.tsx`
- [x] T032 [P] [US2] Component test for `DefibSheet` (energy select 150–360J, count increments) in `tests/component/defibSheet.test.tsx`

### Implementation

- [x] T033 [US2] Add `giveEpi`, `giveAmio`, `logDefib` (dose/shock numbering) actions to `src/domain/useOHCA.ts`
- [x] T034 [US2] Implement `TacTile.tsx` in `src/components/` (kicker, big value, sub, accent dot, due pulse styling)
- [x] T035 [US2] Implement `DefibSheet.tsx` in `src/components/`
- [x] T036 [US2] Wire Epinephrine, Amiodarone, Defib tiles into `App.tsx`

**Checkpoint**: US1 + US2 work independently — core timing + drug decision support

---

## Phase 5: User Story 6 - Offline operation & persistence/restore (Priority: P1)

**Goal**: Fully offline after first load, installable, in-progress case restored across reload

**Independent Test**: Build+preview, disable network, reload → app works; log events,
reload mid-case → case + timeline restored; install to home screen

### Tests (write first, must fail)

- [x] T037 [P] [US6] Integration test: mounting `useOHCA` with a seeded store restores identical derived state in `tests/component/restore.test.tsx`
- [x] T038 [P] [US6] Unit test: every action persists to the store (autosave) in `tests/unit/autosave.test.ts`

### Implementation

- [x] T039 [US6] Finalize PWA manifest in `vite.config.ts` — subpath-correct `start_url`, `scope`, and icon `src` all prefixed `/ohca-field-timer/` (research gotcha; else iOS refuses install)
- [x] T040 [US6] Configure Workbox offline app-shell precache + `registerType: 'autoUpdate'` and verify SW controls navigations under the subpath
- [x] T041 [US6] Harden `src/persistence/caseStore.ts` for localStorage unavailability/quota/private-mode (no throw; degrade gracefully)
- [ ] T042 [US6] Execute quickstart offline + install verification (preview build, airplane mode reload, Add to Home Screen) and record the result in `docs/ui/` or quickstart notes

**Checkpoint**: P1 set complete (US1+US2+US6) — recommended shippable MVP

---

## Phase 6: User Story 3 - Rhythm, airway, IV/IO & vitals (Priority: P2)

**Goal**: Record rhythm/airway/IV access and enter vitals via numeric keypad with MAP

**Independent Test**: Pick rhythm (shockable badge), place ETT+size, mark IV, enter
SBP/DBP via keypad → MAP shown, commit → timestamped vitals row appears

### Tests (write first, must fail)

- [x] T043 [P] [US3] Unit tests for MAP calc + `addVitals` detail-line composition in `tests/unit/vitals.test.ts`
- [x] T044 [P] [US3] Component test for NumPad vitals entry → cell value + MAP pill in `tests/component/vitalsHud.test.tsx`
- [x] T045 [P] [US3] Component tests for `RhythmPicker` (shockable badge) and `AirwayPicker` (ETT size segment) in `tests/component/pickers.test.tsx`
- [x] T046 [P] [US3] Component test: commit vitals creates a timestamped timeline entry in `tests/component/vitalsCommit.test.tsx`

### Implementation

- [x] T047 [US3] Add `setRhythm`, `setAirwayDevice`, `addVitals`, `logIV` actions to `src/domain/useOHCA.ts`
- [x] T048 [US3] Implement `VitalsHUD.tsx` in `src/components/` (3-col cells, MAP pill, ECG note, commit-on-draft)
- [x] T049 [US3] Implement `RhythmPicker.tsx` in `src/components/`
- [x] T050 [US3] Implement `AirwayPicker.tsx` in `src/components/`
- [x] T051 [US3] Wire IV/Rhythm/Airway tiles + VitalsHUD into `App.tsx`

**Checkpoint**: US1+US2+US3 work — full clinical capture

---

## Phase 7: User Story 4 - Live treatment timeline & delete (Priority: P2)

**Goal**: Reverse-chronological timeline + long-press delete keeping summaries consistent

**Independent Test**: Log several actions → newest-first rows with time/offset/tag;
long-press a row → delete → corresponding stat decreases

### Tests (write first, must fail)

- [x] T052 [P] [US4] Component test for `Timeline` (order newest-first, empty state, row fields) in `tests/component/timeline.test.tsx`
- [x] T053 [P] [US4] Component test for `TimelineRow` long-press arms delete, early release no-op, delete updates stats in `tests/component/timelineRow.test.tsx`
- [x] T054 [P] [US4] Component test for `StatsStrip` reflecting derived counts in `tests/component/statsStrip.test.tsx`

### Implementation

- [x] T055 [US4] Implement `Timeline.tsx` and `TimelineRow.tsx` in `src/components/` (long-press ~550ms → 刪除, `onDelete` → removeEvent)
- [x] T056 [US4] Implement `StatsStrip.tsx` in `src/components/`
- [x] T057 [US4] Wire timeline + stats strip into `App.tsx`

**Checkpoint**: US1–US4 work — contemporaneous record with correction

---

## Phase 8: User Story 5 - Milestones & new case (Priority: P2)

**Goal**: ROSC/arrival milestones (clock keeps running) + new-case reset with confirm

**Independent Test**: Tap ROSC → status green + time, clock keeps running; tap arrival
→ recorded; tap new case → confirm → all state resets

### Tests (write first, must fail)

- [x] T058 [P] [US5] Component test for `StatusBtn` ROSC (status→green, clock keeps running) and arrival recorded in `tests/component/statusBtn.test.tsx`
- [x] T059 [P] [US5] Component test: new case confirm resets timers/milestones/events in `tests/component/newCase.test.tsx`

### Implementation

- [x] T060 [US5] Add `declareROSC`, `declareArrival`, `newCase` actions to `src/domain/useOHCA.ts` (milestones do not stop the clock)
- [x] T061 [US5] Implement `StatusBtn.tsx` and the status-actions row + new-case confirm in `src/components/`
- [x] T062 [US5] Wire status actions into `App.tsx`

**Checkpoint**: All user stories independently functional

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, quality gates, and constitution compliance

- [x] T063 [P] Write UI design doc `docs/ui/tactical-hud.md` (layout, tokens, interactions) — constitution Principle III
- [x] T064 [P] Write ADRs `docs/adr/0001-tech-stack-vite-react-ts-pwa.md` and `docs/adr/0002-derived-state-single-source-of-truth.md` — constitution Principle V
- [x] T065 [P] Performance budget check per quickstart (gzipped JS ≤ 150 KB, TTI < 2s, no clock drift over 60-min case) and record results
- [ ] T065a [P] Verify interaction-efficiency success criteria: logging any single action takes ≤ 2 taps (SC-002) and a full BP reading commits in < 15s via the keypad (SC-003), in `tests/component/efficiency.test.tsx`
- [x] T066 [P] Accessibility pass: touch targets ≥ 44px, keypad keys ≥ 56px, aria-labels, contrast (Principle III); also verify all visible copy is Traditional Chinese (zh-Hant) — FR-021
- [x] T067 Code-quality review via mixed Sonnet + Opus subagent panel (constitution Principle VI); findings triaged and addressed — see docs/adr/0003-review-outcomes-and-tradeoffs.md
- [x] T068 Run `npm run format:check` + full `npm run test:run` + `npm run coverage` gate; fix any failures
- [ ] T069 Final real-device E2E verification: offline launch, install, restore mid-case (FR-019/FR-020)

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies — start immediately
- **Foundational (Phase 2)**: depends on Setup — BLOCKS all user stories
- **User Stories (Phases 3–8)**: all depend on Foundational
  - Priority order: US1 → US2 → US6 (all P1) → US3 → US4 → US5 (all P2)
  - Stories are independently testable; P2 stories may proceed in parallel once Foundational is done
- **Polish (Phase 9)**: depends on the targeted user stories being complete

### Story dependencies / independence

- Each story adds its own actions to `src/domain/useOHCA.ts` and its own components.
  Actions within `useOHCA.ts` are same-file (sequential within a story); components are
  separate files (parallel). No story depends on another story's UI.
- US4 (timeline/delete) is most meaningful after events exist (US2/US3) but is testable
  in isolation with seeded events.

### Within each story

- Tests (written first, must fail) → domain actions → components → wire into App

## Parallel Opportunities

- All Setup tasks marked [P] (T002–T009) can run together after T001.
- Foundational tests T010–T012 run together; impl T013, T014, T018, T020 are [P].
- Within each story, all test tasks [P] run together; component files [P] run together
  (the single-file `useOHCA.ts` action task is the sequential point).

### Parallel example — User Story 1

```text
# Tests together:
T022 CPR math · T023 elapsed/adjust · T024 CommandBar · T025 CprBar
# Then components together (after T026 actions):
T027 CommandBar.tsx · T028 CprBar.tsx
```

## Implementation Strategy

### MVP scope

- **Minimal MVP**: User Story 1 (Phase 3) — a usable elapsed + CPR-cycle timer.
- **Recommended shippable MVP**: the P1 set — US1 + US2 + US6 (Phases 3, 4, 5) —
  timing, drug/shock decision support, and offline/persistent operation.

### Incremental delivery

1. Setup + Foundational → core tested and green
2. US1 → validate → demo (minimal MVP)
3. US2 → US6 → validate → ship P1 MVP (offline, persistent)
4. US3 → US4 → US5 → full feature
5. Polish → docs, perf, a11y, review, gates

## Notes

- [P] = different files, no incomplete dependencies.
- Every code change runs Prettier (auto-format hook + `format:check` gate) — Principle I.
- Write tests first and watch them fail before implementing — Principle II.
- After `/speckit-implement`, update ADRs (`docs/adr/`) — Principle V.
- Commit after each task or logical group.
