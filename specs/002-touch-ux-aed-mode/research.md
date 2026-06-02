# Phase 0 Research: Touch Ergonomics & AED Mode Improvements

All decisions below are scoped to the existing offline-first React 18 + Vite + TS
strict PWA. The guiding constraint is "no new runtime dependency unless a primitive is
genuinely missing" — every item here is buildable from pointer events, CSS, and the
existing component primitives.

## R1 — Swipe-to-reveal delete (replacing long-press)

**Decision**: Implement swipe-to-reveal as a self-contained gesture inside
`TimelineRow` using Pointer Events (`onPointerDown/Move/Up/Cancel`) and a CSS
`translateX` transform on the row content, with a fixed-width delete button revealed
behind it. A horizontal drag past an activation threshold (~40% of the button width or
~56 px) latches the row open; releasing below threshold animates back to 0. Direction
is locked on first move: if `|dx| > |dy|` the gesture is a horizontal swipe and the row
captures it; otherwise it is a vertical scroll and the row ignores it. Lift the row's
own pointer capture so the parent list still scrolls. A module-level/context "open row"
coordinator closes any other open row when one opens (FR-003).

**Rationale**: Long-press (current 550 ms timer in `TimelineRow.tsx`) is the reported
pain point — it is timing-sensitive, easy to mis-fire or miss with gloves, and gives no
progressive feedback. A swipe gives continuous visual feedback, a clear affordance
(revealed button), and a two-step confirm (swipe then tap) that resists accidental
deletion (SC-001, SC-007). Pointer Events unify mouse/touch/pen and are already used in
the existing long-press code, so jsdom + `@testing-library/user-event` can drive them in
tests.

**Alternatives considered**:
- _Libraries_ (`react-swipeable`, `framer-motion`, `react-swipeable-list`): rejected —
  adds a runtime dependency and bundle weight against the ≤150 KB budget for ~80 lines
  of gesture code we can own and test directly.
- _Native `<details>`/checkbox CSS-only reveal_: rejected — cannot express a drag
  threshold or velocity and feels unlike a swipe.
- _Keep long-press as a fallback_: rejected per Clarifications (long-press removed
  entirely) to avoid two delete paths and the accidental-delete mode this feature fixes.

**Test approach**: pointer-event sequences (down → move past threshold → up) reveal the
button; move below threshold → up snaps back (no delete); tap revealed button calls
`onDelete`; a near-vertical move does not arm delete (direction lock); opening a second
row closes the first.

## R2 — Glove-friendly touch floor (56×56 px, ≥8 px spacing)

**Decision**: Adopt a single source-of-truth token (e.g. CSS custom property
`--ohca-touch-min: 56px` and `--ohca-touch-gap: 8px`) and apply it as `min-height`/
`min-width` on every interactive control, auditing each component against it. Known
deltas from the audit: `RhythmPicker` buttons are `height: 54` → raise to ≥56; `Seg`
default is `40` (and `sm` 32) → introduce a glove size (`lg`, ≥56) for the AED mode
toggle and any primary use; verify `NumPad` keys, `StatusBtn`, `ThemeToggle`, and the
`DefibSheet`/`Sheet` controls meet the floor and gaps. `TacTile` (minHeight 104) and
`DefibSheet` energy buttons (60) already pass.

**Rationale**: The spec fixed a concrete, testable floor (FR-006, SC-002). 56 px sits
above the Material 48 dp baseline and aligns with WCAG 2.2 "Target Size (Enhanced)"
guidance (44 px minimum, larger for stress/gloves), balancing reliability with phone
screen density (constitution III accessibility). A token keeps it consistent and makes
the touch-target test assert one value.

**Alternatives considered**:
- _Per-component ad-hoc sizes_: rejected — drifts and is hard to test.
- _64 px floor_: rejected for now — crowds the 2-column tile grid on small phones; 56 px
  was the clarified decision.

**Test approach**: a component test renders each primary control and asserts its
computed/declared min dimensions ≥ 56 and inter-target gap ≥ 8 (read from inline styles
/ tokens, since jsdom does not do real layout).

## R3 — Adaptive layout (portrait single-column → landscape/wide multi-zone)

**Decision**: Drive layout from viewport, not device. Add `useViewport` over
`window.matchMedia('(min-width: 900px) and (orientation: landscape)')` (plus a wide
breakpoint, e.g. `min-width: 1000px`) returning a `wide` flag. When `wide`, `App`
renders a two-zone CSS grid: a left/primary zone (CommandBar, CPR, status, action
tiles, vitals) and a right zone with the treatment timeline persistently visible; in
portrait it renders today's single scrolling column unchanged. Zone composition is the
same components re-parented — no duplicated logic. Use CSS `grid`/`max-width` so there
are no large empty gutters (FR-009) and `clamp()`/`minmax()` so touch targets keep the
R2 floor at all widths (FR-010).

**Rationale**: The clarified strategy (Q3 = adaptive) keeps the proven phone-portrait
UX intact while using width on tablets/landscape. matchMedia is dependency-free, SSR-
irrelevant (CSR PWA), and mockable in tests. Because all state lives in `useOHCA` and is
viewport-independent, re-parenting components on rotation cannot lose case state
(FR-011) — React preserves the hook state in `App`.

**Alternatives considered**:
- _CSS-only (media queries, no JS flag)_: viable for pure styling but the timeline needs
  to move from below the fold into a persistent side zone (DOM reparenting), which is
  cleaner with a JS flag; we still use CSS for sizing.
- _Container queries_: attractive but unevenly supported on older field devices; a top-
  level matchMedia flag is simpler and sufficient for one breakpoint set.
- _A UI framework grid/responsive lib_: rejected — no new dependency needed.

**Test approach**: mock `matchMedia` to return `wide: false` and assert single-column
ordering; return `wide: true` and assert the timeline is rendered in the persistent
zone; simulate a change event and assert case-derived values (elapsed, counts) are
unchanged across the switch.

## R4 — Simplified AED rhythm mode (進階 ACLS ⇄ 簡易 AED)

**Decision**: Implement exactly the pre-agreed backlog design
(`docs/backlog/aed-simplified-rhythm.md`). Add `AED_OUTCOMES` to `constants.ts`:
`{ key: 'shock', label: '可電擊 AED建議電擊', shockable: true }` and
`{ key: 'noshock', label: '不可電擊 AED不建議電擊', shockable: false }`. Add a mode
toggle (the `Seg` control at a glove size) at the top of the rhythm sheet; 進階 ACLS
shows the existing 5-rhythm picker, 簡易 AED shows two large buttons. Both modes call the
existing `actions.setRhythm(label)` → same `rhythm` event kind; `initialRhythm` /
`lastRhythm` and the summary "心律" cell (which already does `label.split(' ')[0]`) work
unchanged, showing `可電擊`/`不可電擊`. After 建議電擊, present a one-tap 已電擊 confirm
that calls `actions.logDefib(null, …)`; declining keeps the recorded rhythm.

**Rationale**: Reusing the `rhythm` event kind means no schema-version bump, no change
to `derive.ts`, and the single-source-of-truth invariant holds (FR-016). The clinical
guardrail (never infer a specific rhythm from a coarse outcome) is satisfied by storing
only the coarse label and never mapping it back — the label literally is 可電擊/不可
電擊. This is the lowest-risk change that meets US4 and matches a decision already
captured with the user.

**Decision — default & memory**: Default 進階 ACLS; remember last-used mode in a
standalone `localStorage` key (`ohca.rhythmMode`) via `prefStore`/`useRhythmMode`, kept
separate from the versioned case state so `newCase()` / case clear never resets it
(FR-015).

**Alternatives considered**:
- _New `aed` event kind_: rejected — would force changes to `EVENT_META`, `derive.ts`,
  and the timeline, and fragment the rhythm history for no clinical benefit.
- _Store mode inside `CaseState`_: rejected — a per-case mode would forget the
  operator's preference on every new case and would need a schema bump; the backlog
  explicitly calls for a separate preference key.
- _Defibrillation energy toggle interpretation_: rejected — the user confirmed the
  rhythm-simplification interpretation (Clarifications, this feature).

**Test approach**: unit-test `prefStore` (read/write/default) and the coarse-outcome
labels (shockable flags, never equal to a specific ACLS rhythm key); component-test the
toggle switching pickers, recording 可電擊/不可電擊 via `setRhythm`, the 已電擊 shortcut
calling `logDefib` on accept and not on decline, and the remembered mode on remount.

## R5 — Testing utilities for gestures & responsiveness

**Decision**: Use `@testing-library/user-event` and `fireEvent` pointer APIs already in
the dev stack; add a small `matchMedia` mock in `tests/setup.ts` (jsdom has none) and,
if needed, minimal `setPointerCapture`/`releasePointerCapture` no-op shims for jsdom.
No new test dependency.

**Rationale**: Keeps TDD friction low and the toolchain unchanged (Principle II), and
makes the responsive and swipe behaviour deterministically testable in jsdom despite its
lack of real layout/gesture support.

**Alternatives considered**: Playwright/Cypress E2E — out of scope for this increment;
the behaviours are unit/component-testable and 001 established no E2E harness.

## Summary of decisions

| # | Area | Decision | New dependency? |
|---|------|----------|-----------------|
| R1 | Delete gesture | Own pointer-event swipe-to-reveal in `TimelineRow`; remove long-press | No |
| R2 | Touch floor | Token `--ohca-touch-min:56px` / `--ohca-touch-gap:8px`, audit all controls | No |
| R3 | Responsive | `useViewport` matchMedia flag → two-zone grid when wide; CSS sizing | No |
| R4 | AED mode | `AED_OUTCOMES` + `Seg` toggle in rhythm sheet, reuse `rhythm` event, `prefStore` | No |
| R5 | Test utils | user-event pointer APIs + `matchMedia` mock in setup | No |

No `NEEDS CLARIFICATION` items remain; all spec clarifications (touch floor, long-press
removal, responsive strategy, AED interpretation) are resolved and reflected above.
