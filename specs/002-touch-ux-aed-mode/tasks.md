# Tasks: Touch Ergonomics & AED Mode Improvements

**Input**: Design documents from `/specs/002-touch-ux-aed-mode/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: REQUIRED. Constitution Principle II (Test-First Development, NON-NEGOTIABLE)
mandates a failing test before implementation for every change. All test tasks below
MUST be written, run, and observed to FAIL (Red) before their implementation tasks.

**Organization**: Tasks are grouped by user story so each story is independently
implementable and testable. This feature extends the existing app (feature 001); no
project scaffolding is required.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: US1 / US2 / US3 / US4 (maps to spec.md user stories)

## Path Conventions

Single-project web app at repository root: `src/`, `tests/`, `docs/` (per plan.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing toolchain; no new runtime dependencies (research.md R1–R5).

- [ ] T001 [P] Confirm dev tooling is ready (Vitest, @testing-library/react, @testing-library/user-event, Prettier) and that NO new runtime dependency is introduced, per research.md; no change to package.json runtime deps

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Cross-cutting scaffolding used by multiple stories' tests and controls.

**⚠️ CRITICAL**: T002 blocks US2 (and the touch floor of US1/US4 controls); T003 blocks the US1 (pointer) and US3 (matchMedia) tests.

- [ ] T002 [P] Add touch-target tokens `--ohca-touch-min: 56px` and `--ohca-touch-gap: 8px` (plus an optional `.ohca-touchable` helper) to src/styles/global.css
- [ ] T003 [P] Extend tests/setup.ts with a `window.matchMedia` mock and no-op `setPointerCapture`/`releasePointerCapture` shims for jsdom

**Checkpoint**: Tokens and test harness ready — user stories can begin.

---

## Phase 3: User Story 1 - Swipe-to-reveal delete (Priority: P1) 🎯 MVP

**Goal**: Replace the long-press timeline-entry delete with a swipe-to-reveal delete button.

**Independent Test**: Log several events; swipe a row sideways → `刪除` button appears; tap it → row removed and 處置摘要 counts drop. Partial swipe snaps back (no delete). Vertical scroll never arms delete. Long-press does nothing.

### Tests for User Story 1 ⚠️ (write first, must FAIL)

- [ ] T004 [P] [US1] Write failing component test covering SW-1..SW-7 (reveal past threshold, partial snap-back, tap-delete recomputes summaries, one-open-at-a-time, vertical-scroll direction lock, long-press does nothing) in tests/component/timelineSwipeDelete.test.tsx

### Implementation for User Story 1

- [ ] T005 [US1] Rewrite src/components/TimelineRow.tsx: pointer-event swipe-to-reveal delete with first-move direction lock, threshold latch/snap-back animation, and revealed `刪除` button; remove the 550 ms long-press logic entirely (FR-001, FR-002, FR-004)
- [ ] T006 [US1] Add one-open-at-a-time coordination in src/components/Timeline.tsx (openId/onOpen props or a small context) so opening one row closes any other (FR-003)
- [ ] T007 [US1] Ensure the revealed `刪除` button meets the touch floor using the T002 tokens in src/components/TimelineRow.tsx (FR-006)
- [ ] T008 [US1] Update the timeline hint text in src/App.tsx from `長按項目可刪除` to `滑動項目可刪除`

**Checkpoint**: US1 fully functional and independently testable (MVP).

---

## Phase 4: User Story 2 - Glove-friendly touch floor (Priority: P1)

**Goal**: Every interactive control meets ≥56×56 CSS px with ≥8 px spacing, with a bounce guard against double-counted gloved taps.

**Independent Test**: With an imprecise/gloved contact, each primary control activates on the first attempt with no adjacent mis-hit; a single contact never double-counts while genuine rapid taps each register.

### Tests for User Story 2 ⚠️ (write first, must FAIL)

- [ ] T009 [P] [US2] Write failing component test covering TT-1..TT-5 (every primary control ≥56×56, ≥8 px gap, holds in all layouts) in tests/component/touchTargets.test.tsx

### Implementation for User Story 2

- [ ] T010 [US2] Add a glove size (e.g. `size="lg"`, ≥56 px) to src/components/Seg.tsx (reused by the US4 AED toggle)
- [ ] T011 [P] [US2] Raise the rhythm buttons from 54 to ≥56 px and ensure ≥8 px gaps in src/components/RhythmPicker.tsx (coordinate with T028 — same file)
- [ ] T012 [P] [US2] Audit/raise keypad keys to ≥56×56 with ≥8 px spacing in src/components/NumPad.tsx
- [ ] T013 [P] [US2] Audit/raise the status buttons to the touch floor in src/components/StatusBtn.tsx
- [ ] T014 [P] [US2] Audit/raise the theme toggle to the touch floor in src/components/ThemeToggle.tsx
- [ ] T015 [P] [US2] Audit DefibSheet and Sheet controls against the touch floor in src/components/DefibSheet.tsx and src/components/Sheet.tsx
- [ ] T016 [US2] Implement a tap bounce-guard utility (e.g. src/hooks/useTapGuard.ts) and apply it to primary action handlers via src/components/TacTile.tsx so a single gloved contact is not double-counted while genuine rapid taps still register (FR-008)

**Checkpoint**: US1 AND US2 both work independently.

---

## Phase 5: User Story 3 - Adaptive landscape/wide layout (Priority: P2)

**Goal**: Keep the single column in phone portrait; reflow into a multi-zone layout (timers/actions beside a persistent timeline) in landscape and on wide viewports, preserving state across rotation.

**Independent Test**: On a wide/landscape viewport the timeline sits beside the primary controls with no empty gutters; portrait keeps the single column; rotating mid-case preserves elapsed clock and all counts.

### Tests for User Story 3 ⚠️ (write first, must FAIL)

- [ ] T017 [P] [US3] Write failing component test covering RL-1..RL-4 (portrait single-column vs wide two-zone via mocked matchMedia; case-derived values unchanged across a wide toggle) in tests/component/responsiveLayout.test.tsx

### Implementation for User Story 3

- [ ] T018 [P] [US3] Create src/hooks/useViewport.ts returning a `wide` flag from `matchMedia('(min-width: 900px) and (orientation: landscape)')` or `(min-width: 1000px)` (responsive-contract.md)
- [ ] T019 [US3] Refactor src/App.tsx to render a two-zone CSS grid when `wide` (primary zone: CommandBar/CPR/status/tiles/vitals/stats; side zone: persistent Timeline) and the current single column otherwise; re-parent the same components without duplicating logic (FR-009, FR-011)
- [ ] T020 [US3] Add responsive grid/sizing CSS (clamp/minmax, no large gutters, touch floor preserved, touch-first) in src/styles/global.css (FR-010; coordinate with T002 — same file)

**Checkpoint**: US1, US2, US3 all independently functional.

---

## Phase 6: User Story 4 - Simplified AED rhythm mode (Priority: P2)

**Goal**: Add a 進階 ACLS ⇄ 簡易 AED toggle to the rhythm sheet; 簡易 AED records a coarse 可電擊/不可電擊 outcome (never a specific rhythm) with a one-tap 已電擊 shortcut; default 進階 ACLS and remember the last-used mode.

**Independent Test**: Open 心律分析 → switch to 簡易 AED → tap 建議電擊 → coarse `可電擊` recorded and a one-tap 已電擊 logs a shock; switch to 進階 ACLS → 5-rhythm picker returns; reload → opens in last-used mode; new case → mode retained.

### Tests for User Story 4 ⚠️ (write first, must FAIL)

- [ ] T021 [P] [US4] Write failing unit test for the AED_OUTCOMES table (coarse labels, shockable flags, and that no outcome equals/maps to a specific RHYTHMS key — clinical guardrail) in tests/unit/aedOutcomes.test.ts
- [ ] T022 [P] [US4] Write failing unit test for prefStore (PR-1..PR-5: default 進階 ACLS, write on change, restore on reload, untouched by newCase, corrupt-value fallback) in tests/unit/prefStore.test.ts
- [ ] T023 [P] [US4] Write failing component test covering AED-1..AED-8 (toggle shows correct picker, coarse outcome recorded via setRhythm, 已電擊 shortcut logs/declines, remembered mode) in tests/component/rhythmAedMode.test.tsx

### Implementation for User Story 4

- [ ] T024 [P] [US4] Add `RhythmMode = '進階 ACLS' | '簡易 AED'` type to src/domain/types.ts
- [ ] T025 [P] [US4] Add `AedOutcome` interface and `AED_OUTCOMES` table (`可電擊 AED建議電擊` shockable, `不可電擊 AED不建議電擊` not) to src/domain/constants.ts (data-model.md)
- [ ] T026 [US4] Create src/persistence/prefStore.ts persisting `ohca.rhythmMode` with read/write/default and corrupt-value fallback, tolerant of unavailable storage (mirror caseStore.ts pattern; FR-015)
- [ ] T027 [US4] Create src/hooks/useRhythmMode.ts to read and persist the remembered rhythm-analysis mode via prefStore
- [ ] T028 [US4] Update src/components/RhythmPicker.tsx: add the 進階 ACLS ⇄ 簡易 AED toggle (Seg `lg` from T010), render the two AED outcome buttons in 簡易 AED mode, record outcomes via the existing `onPick`/`setRhythm`, and expose a one-tap 已電擊 shortcut callback after 建議電擊 (FR-012, FR-013, FR-014, FR-016; coordinate with T011 — same file)
- [ ] T029 [US4] Wire RhythmPicker into src/App.tsx: feed mode from useRhythmMode, persist on toggle, route 建議電擊 → `actions.logDefib(null)` shortcut on accept, and keep `setRhythm` for both modes (FR-014; coordinate with T008/T019 — same file)

**Checkpoint**: All four user stories independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, ADRs, and the constitution quality gates.

- [ ] T030 [P] Update docs/ui/tactical-hud.md to document swipe-delete, the touch floor, the adaptive layout, and the AED toggle (Principle III)
- [ ] T031 [P] Add ADR docs/adr/0004-swipe-delete-over-long-press.md (Principle V)
- [ ] T032 [P] Add ADR docs/adr/0005-aed-coarse-rhythm-mode.md, including the clinical guardrail (Principle V)
- [ ] T033 [P] Mark docs/backlog/aed-simplified-rhythm.md as realized by feature 002 (link to this spec)
- [ ] T034 Run `npx prettier --check .` and fix any formatting (Principle I)
- [ ] T035 Run `npm run test:run`; confirm all suites pass and the previously-failing new tests are now green (Principle II)
- [ ] T036 Build and preview (`npm run build` + `npm run preview`); verify the PWA still launches offline and the feature 001 performance budgets still hold (Principle IV)
- [ ] T037 Run the quickstart.md manual verification of all four changes
- [ ] T038 Mixed Sonnet + Opus subagent code review for the non-trivial changes (Principle VI)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: after Setup. T002 blocks US2 + touch-floor work; T003 blocks US1/US3 tests.
- **User Stories (Phase 3–6)**: after Foundational. Independent of each other except for shared-file ordering (below).
- **Polish (Phase 7)**: after all targeted stories.

### User Story Dependencies

- **US1 (P1)**, **US2 (P1)**, **US3 (P2)**, **US4 (P2)** are each independently testable. No story depends on another's behaviour.

### Shared-file ordering (NOT parallel across stories)

- **src/App.tsx**: T008 (US1) → T019 (US3) → T029 (US4) must be sequential (same file).
- **src/components/RhythmPicker.tsx**: T011 (US2) and T028 (US4) must be sequential (same file).
- **src/styles/global.css**: T002 (Foundational) before T020 (US3) (same file).

### Within each user story

- Test task(s) first, observed FAILING, before implementation (Principle II).
- Models/constants/types before the components that consume them.

### Parallel Opportunities

- T002 and T003 (Foundational) run in parallel.
- Each story's test task is [P] and can be written in parallel with other stories' tests.
- US2 control audits T011–T015 are [P] (different files) — but T011 must coordinate with T028 (US4) since both edit RhythmPicker.
- US4 T021/T022/T023 (tests) and T024/T025 (types/constants) are [P].
- Polish T030–T033 are [P] (different docs).
- With multiple developers: US1, US2, US3, US4 can proceed in parallel after Foundational, respecting the shared-file ordering for App.tsx, RhythmPicker.tsx, and global.css.

---

## Parallel Example: User Story 4

```bash
# Write all US4 tests together (must fail first):
Task: "AED_OUTCOMES unit test in tests/unit/aedOutcomes.test.ts"
Task: "prefStore unit test in tests/unit/prefStore.test.ts"
Task: "Rhythm AED mode component test in tests/component/rhythmAedMode.test.tsx"

# Then the independent type/constant additions together:
Task: "Add RhythmMode type in src/domain/types.ts"
Task: "Add AED_OUTCOMES in src/domain/constants.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1: Setup → 2. Phase 2: Foundational → 3. Phase 3: US1 (swipe-delete).
4. **STOP and VALIDATE**: test US1 independently. 5. Deploy/demo if ready.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 (swipe-delete) → test → demo (MVP — fixes the reported pain point).
3. US2 (touch floor) → test → demo.
4. US3 (responsive) → test → demo.
5. US4 (AED mode) → test → demo.
Each story adds value without breaking the previous ones.

### Parallel Team Strategy

After Foundational: Developer A → US1, B → US2, C → US3, D → US4, coordinating edits to
App.tsx, RhythmPicker.tsx, and global.css per the shared-file ordering above.

---

## Notes

- [P] = different files, no dependency on incomplete work.
- Verify every test FAILS before implementing (Principle II, NON-NEGOTIABLE).
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
- No new runtime dependency is added (research.md); offline behaviour and case
  persistence from feature 001 must remain intact.
