# Feature Specification: Touch Ergonomics & AED Mode Improvements

**Feature Branch**: `002-touch-ux-aed-mode`

**Created**: 2026-06-02

**Status**: Draft

**Input**: User description: "修正 長按在手手感不佳改用滑動顯示刪除按鈕；修正 寬螢幕 或是橫向頁面的 UI 介面 符合觸控螢幕操作；修正 戴手套觸控最佳化；簡易 實作 AED 切換"

## Clarifications

### Session 2026-06-02

- Q: What is the glove-friendly minimum touch target size and spacing? → A: Minimum
  56×56 CSS px target with ≥8 px spacing between adjacent targets.
- Q: Is the long-press deletion removed entirely or kept as a secondary path? → A:
  Removed entirely; swipe-to-reveal-delete is the only deletion method.
- Q: What wide/landscape layout strategy should be used? → A: Adaptive — phone
  portrait keeps the current single column; landscape/wide reflows into a multi-zone
  layout (timers/actions alongside a persistent timeline).
- Q: What does the "AED toggle" mean — a defibrillation energy mode or a rhythm-
  analysis simplification? → A: Rhythm-analysis simplification, per the pre-agreed
  design in `docs/backlog/aed-simplified-rhythm.md`. The rhythm-analysis sheet gains
  a 進階 ACLS ⇄ 簡易 AED toggle; 簡易 AED records only a coarse 可電擊/不可電擊
  decision (never back-mapped to a specific rhythm), with a one-tap 已電擊 shortcut
  after 建議電擊, defaulting to 進階 ACLS and remembering the last-used mode.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Delete a timeline entry by swiping instead of long-pressing (Priority: P1)

During a resuscitation a rescuer mis-taps and logs an action in error. Today they
must press and hold the entry, which feels unreliable in the hand — especially
under stress or while moving — and sometimes triggers accidentally or not at all.
Instead, the rescuer swipes the timeline entry sideways to reveal a clearly
labelled delete button, taps it to confirm removal, and the entry is gone with
all summary counters updated. A swipe that is started but not completed snaps the
entry back with nothing deleted.

**Why this priority**: Correcting mis-taps is essential during a live case, and the
current long-press gesture is the reported pain point this feature exists to fix.
A predictable swipe-to-reveal-delete is the single highest-value change.

**Independent Test**: Log several actions, swipe one entry sideways, confirm a
delete button is revealed; tap it and confirm the entry is removed and the
corresponding summary counter decreases. Begin a partial swipe and release early,
and confirm the entry snaps back and nothing is deleted.

**Acceptance Scenarios**:

1. **Given** logged timeline entries, **When** the rescuer swipes an entry
   horizontally past the activation threshold, **Then** a clearly labelled delete
   button is revealed for that entry.
2. **Given** a revealed delete button, **When** the rescuer taps it, **Then** the
   entry is removed and every derived summary (shocks, Epi, Amio, initial rhythm)
   updates accordingly.
3. **Given** a partial swipe below the activation threshold, **When** the rescuer
   releases, **Then** the entry snaps back to its resting position and nothing is
   deleted.
4. **Given** one entry with its delete button revealed, **When** the rescuer swipes
   or taps a different entry, **Then** the first entry closes so only one delete
   action is armed at a time.
5. **Given** the timeline, **When** the rescuer scrolls vertically, **Then** the
   vertical scroll is not mistaken for a horizontal delete swipe.

---

### User Story 2 - Operate every control reliably while wearing gloves (Priority: P1)

A rescuer wearing medical or work gloves needs to tap drug tiles, defibrillation,
rhythm, the numeric keypad, and the new swipe-delete with thick fingertips and
reduced precision. Every interactive control is large enough and spaced far enough
apart that the rescuer hits the intended target on the first attempt without
zooming, and there are no interactions that require fine pointing or fast,
precise gestures.

**Why this priority**: Gloved operation is the real field condition; if controls
are too small or too close, the swipe-delete and AED changes in this feature would
themselves be unusable. Touch sizing underpins every other story.

**Independent Test**: With a glove (or a deliberately imprecise large-tip touch),
tap each primary action tile, a keypad digit, and the swipe-delete button in
sequence; confirm each is activated on the first attempt with no mis-hits on an
adjacent control.

**Acceptance Scenarios**:

1. **Given** any primary action control, **When** measured, **Then** its touch
   target meets the glove-friendly minimum size and minimum spacing from
   neighbouring targets.
2. **Given** the numeric keypad, **When** a gloved rescuer enters a value, **Then**
   adjacent digits are not accidentally triggered.
3. **Given** the swipe-to-delete gesture, **When** performed with a large imprecise
   contact, **Then** it still activates reliably without demanding fine precision.
4. **Given** repeated rapid taps on a single control, **When** logged, **Then** each
   intended tap registers without double-counting from gloved contact bounce.

---

### User Story 3 - Use the app comfortably on wide screens and in landscape (Priority: P2)

A rescuer or recorder uses the app on a tablet, a phone rotated to landscape, or a
larger touchscreen mounted in the field. The interface adapts to the wider/landscape
viewport so that the elapsed clock, action tiles, vitals, and timeline are all
reachable and legible without awkward stretching, empty gutters, or controls that
become too small or too far apart for touch. The layout remains a touch interface —
not a desktop pointer layout — at every supported width and orientation.

**Why this priority**: Field deployments increasingly use tablets and mounted
touchscreens; the current phone-portrait optimisation degrades in landscape and on
wide screens. Important for those deployments but secondary to the core gesture and
glove fixes.

**Independent Test**: Open the app on a wide/landscape viewport, confirm the layout
reflows so all key areas (clock, actions, vitals, timeline) are visible and touch
targets keep their glove-friendly size; rotate between portrait and landscape and
confirm no content is clipped, overlapped, or stretched unusably.

**Acceptance Scenarios**:

1. **Given** a wide or landscape viewport, **When** the app is displayed, **Then**
   the primary areas reflow to use the available width without horizontal scrolling,
   clipped content, or large empty gutters.
2. **Given** landscape orientation, **When** the rescuer interacts, **Then** all
   touch targets retain their glove-friendly minimum size and spacing.
3. **Given** a device is rotated between portrait and landscape mid-case, **When**
   the orientation changes, **Then** the current case state and all displayed values
   are preserved and the layout adapts without data loss.
4. **Given** a wide touchscreen, **When** displayed, **Then** the interface remains a
   touch-first layout (large tiles/controls), not a dense pointer-oriented layout.

---

### User Story 4 - Record a coarse shock decision in simplified AED mode (Priority: P2)

A less-trained, BLS, or public-setting rescuer who cannot reliably classify a
specific ACLS rhythm needs to record only whether a shock is advised. In the
rhythm-analysis sheet they flip a mode toggle between 進階 ACLS and 簡易 AED. In
簡易 AED mode they see two large choices — 建議電擊（可電擊節律）and 不建議電擊（不可
電擊節律）— and tap one to record the coarse decision. Choosing 建議電擊 also offers a
quick 已電擊 one-tap confirm so the shock can be logged immediately (an AED delivers
a fixed energy). The sheet opens in 進階 ACLS by default and remembers the last-used
mode. The coarse outcome is recorded only as 可電擊/不可電擊 and is never inferred to
a specific rhythm.

**Why this priority**: It broadens the tool to BLS/public-setting responders who
cannot classify ACLS rhythms, but the core timer and advanced rhythm picker already
work, so it ranks after the ergonomics fixes.

**Independent Test**: Open the rhythm-analysis sheet, switch to 簡易 AED, tap 建議
電擊, and confirm a coarse "可電擊" rhythm is recorded and a one-tap 已電擊 confirm is
offered that logs a shock; switch back to 進階 ACLS and confirm the 5-rhythm picker
returns; reload the app and confirm the last-used mode is restored.

**Acceptance Scenarios**:

1. **Given** the rhythm-analysis sheet, **When** the rescuer selects 簡易 AED mode,
   **Then** the sheet shows two large choices, 建議電擊（可電擊節律）and 不建議電擊
   （不可電擊節律）, instead of the five-rhythm picker.
2. **Given** 簡易 AED mode, **When** the rescuer taps 建議電擊 or 不建議電擊, **Then** a
   rhythm event recording the coarse outcome (可電擊 / 不可電擊) is added and shockable
   outcomes are clearly marked, without classifying a specific rhythm.
3. **Given** the rescuer has just chosen 建議電擊, **When** the one-tap 已電擊 confirm
   is offered and accepted, **Then** a defibrillation shock is logged; **When** it is
   declined, **Then** the coarse rhythm remains recorded and no shock is logged.
4. **Given** the rhythm-analysis sheet, **When** the rescuer switches to 進階 ACLS,
   **Then** the existing five-rhythm picker (VF / pVT / PEA / Asystole / ROSC) with
   the 可電擊 badge is shown.
5. **Given** a previously used mode, **When** the app is reloaded or relaunched,
   **Then** the rhythm-analysis sheet opens in that mode; absent any prior choice it
   defaults to 進階 ACLS.

---

### Edge Cases

- A swipe-delete is revealed on an entry and the rescuer logs a new event → the new
  entry appears and any open delete control closes; the new entry is never deleted
  by the prior armed swipe.
- A swipe is ambiguous between horizontal (delete) and vertical (scroll) → the
  dominant direction wins; an ambiguous small movement defaults to scroll and does
  not arm delete.
- The very last remaining timeline entry is deleted by swipe → the timeline returns
  to its empty-state message and all summary counters reset consistently.
- The rhythm-analysis mode is switched between 進階 ACLS and 簡易 AED mid-case →
  already-recorded rhythm and coarse-outcome events are unchanged; the mode only
  affects subsequent rhythm inputs, and the coarse AED outcome is never converted to a
  specific rhythm.
- A coarse AED outcome and a specific ACLS rhythm both appear in one case → both are
  ordinary rhythm events on the timeline; initial/last rhythm derivations treat them
  uniformly and never infer one from the other.
- The viewport is extremely narrow or extremely wide → the layout still presents all
  primary controls at glove-friendly size without clipping or overlap.
- A gloved double-contact (bounce) on a control → only one action is registered.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The app MUST let the rescuer delete a timeline entry via a horizontal
  swipe that reveals a clearly labelled delete button. This swipe-to-reveal-delete
  MUST be the only deletion method; the previous long-press delete gesture MUST be
  removed entirely.
- **FR-002**: A swipe that does not reach the activation threshold MUST snap the
  entry back to its resting position and MUST NOT delete anything.
- **FR-003**: At most one timeline entry's delete control MAY be revealed at a time;
  revealing or interacting with another entry MUST close any previously revealed
  delete control.
- **FR-004**: Horizontal delete swipes MUST be distinguishable from vertical list
  scrolling so that scrolling the timeline never accidentally arms or triggers a
  delete.
- **FR-005**: Deleting an entry via swipe MUST keep all derived summaries (shocks,
  Epinephrine doses, Amiodarone doses, initial rhythm) consistent, identical to the
  prior deletion behaviour.
- **FR-006**: All interactive controls MUST meet a glove-friendly minimum touch
  target size of 56×56 CSS pixels with at least 8 CSS pixels of spacing between
  adjacent targets, suitable for imprecise gloved contact.
- **FR-007**: The app MUST avoid interactions that require fine pointing precision or
  fast precise gestures; all primary actions MUST be achievable with large, imprecise
  gloved contact.
- **FR-008**: The app MUST guard against gloved contact "bounce" so a single intended
  tap is not double-counted, while still allowing genuine rapid repeated taps to each
  register.
- **FR-009**: The interface MUST adapt responsively to wide and landscape viewports so
  that the elapsed clock, action tiles, vitals entry, and timeline are all visible and
  reachable without horizontal scrolling, clipped content, or large empty gutters.
  Phone portrait MUST keep the current single-column layout; landscape and wide
  viewports MUST reflow into a multi-zone layout that places the timers/action tiles
  alongside a persistently visible treatment timeline.
- **FR-010**: In wide and landscape layouts, all touch targets MUST retain the
  glove-friendly minimum size and spacing defined in FR-006 and remain a touch-first
  (not pointer-dense) layout.
- **FR-011**: Rotating the device or changing viewport size mid-case MUST preserve the
  active case state and all displayed values with no data loss.
- **FR-012**: The rhythm-analysis sheet MUST provide a mode toggle that switches
  between 進階 ACLS mode (the existing five-rhythm picker) and 簡易 AED mode.
- **FR-013**: In 簡易 AED mode, the sheet MUST present two large choices — 建議電擊
  （可電擊節律）and 不建議電擊（不可電擊節律）— and selecting one MUST record a rhythm
  event capturing the coarse outcome (可電擊 / 不可電擊) with shockable outcomes clearly
  marked, without classifying a specific ACLS rhythm.
- **FR-014**: When the rescuer selects 建議電擊, the app MUST offer a one-tap 已電擊
  confirm that logs a defibrillation shock; declining MUST still leave the coarse
  rhythm recorded and log no shock.
- **FR-015**: The rhythm-analysis mode MUST default to 進階 ACLS and MUST remember the
  last-used mode across reload, background, and relaunch, persisted separately from the
  case record.
- **FR-016**: The coarse AED outcome MUST NOT be back-mapped or inferred to a specific
  rhythm (e.g., must never be recorded as VF); only 可電擊/不可電擊 is stored, and the
  initial/last rhythm derivations and timeline MUST treat it as an ordinary rhythm
  event.
- **FR-017**: All new and changed user-facing interface text MUST be presented in
  Traditional Chinese (zh-Hant), consistent with the existing design.
- **FR-018**: Any change to UI structure, layout, or interaction flow introduced by
  this feature MUST be reflected in the existing in-product interaction patterns so
  behaviour remains consistent across the application.

### Key Entities _(include if feature involves data)_

- **Rhythm event (extended)**: An existing timeline event that may now carry a coarse
  AED outcome (可電擊 / 不可電擊) in place of a specific ACLS rhythm; it is treated
  identically by the timeline and the initial/last rhythm derivations and is never
  inferred to a specific rhythm.
- **Rhythm-analysis mode preference**: A persisted UI preference indicating whether the
  rhythm-analysis sheet opens in 進階 ACLS or 簡易 AED mode; remembered across reloads
  and stored separately from the case record.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A rescuer can delete an unwanted timeline entry by swipe-and-tap in no
  more than two deliberate gestures, with no accidental deletions during normal
  vertical scrolling in 100% of scroll attempts.
- **SC-002**: A gloved rescuer can activate any primary control on the first attempt in
  at least 95% of attempts, with no mis-hit on an adjacent control; every primary
  control measures at least 56×56 CSS pixels with ≥8 px spacing.
- **SC-003**: On supported wide and landscape viewports, 100% of primary areas (clock,
  actions, vitals, timeline) are visible and operable without horizontal scrolling or
  clipped content.
- **SC-004**: Rotating the device between portrait and landscape mid-case results in
  zero loss of case state or logged events in 100% of attempts.
- **SC-005**: In 簡易 AED mode a rescuer can record a coarse shock decision in a single
  tap, switching between 進階 ACLS and 簡易 AED takes no more than one toggle action,
  and choosing 建議電擊 lets the rescuer log the shock in one additional tap.
- **SC-006**: The remembered rhythm-analysis mode is correctly restored after reload in
  100% of attempts.
- **SC-007**: After the change, the deletion gesture success rate (intended deletions
  completed without retry) improves relative to the prior long-press, and no logged
  event is ever deleted unintentionally during the test scenarios.

## Assumptions

- This feature modifies the existing **Tactical HUD OHCA Field Timer**
  (`specs/001-tactical-hud-timer/`); all behaviour not explicitly changed here remains
  as specified there.
- "簡易 實作 AED 切換" is interpreted as a simplified rhythm-analysis mode, per the
  pre-agreed design in `docs/backlog/aed-simplified-rhythm.md`: a 進階 ACLS ⇄ 簡易 AED
  toggle in the rhythm-analysis sheet, where 簡易 AED records only a coarse 可電擊/不可
  電擊 decision with a one-tap 已電擊 shortcut. It does **not** add AED device emulation,
  rhythm auto-analysis, or charge/discharge sequencing — those are out of scope. The
  existing manual defibrillation energy picker (150–360 J) is unchanged.
- The glove-friendly minimum touch target follows established accessible touch sizing
  guidance for high-stress field use; the concrete minimum is fixed at 56×56 CSS px
  with ≥8 px spacing (see Clarifications / FR-006).
- "Wide screen / landscape" covers tablets, rotated phones, and mounted field
  touchscreens; a true desktop pointer-first layout is out of scope — the interface
  stays touch-first at all widths.
- Swipe-to-delete fully replaces long-press as the deletion method; the long-press
  delete gesture is removed entirely (see Clarifications / FR-001).
- The defibrillation mode is a single device-level preference applied to the active
  case; there is no per-case independent configuration requirement.
- AED mode does not change shock counting semantics other than omitting the manual
  energy value; shocks continue to contribute to the shared shock counter.
