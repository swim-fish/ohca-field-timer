# Interaction Contract: Swipe-Delete, Touch Floor, AED Mode

This is the UI behaviour contract for the three interaction changes (the responsive
layout is in `responsive-contract.md`). Each clause is testable and maps to spec FRs.

## 1. Swipe-to-reveal delete (FR-001..FR-005)

**Component**: `TimelineRow` (replaces the long-press implementation entirely).

| ID   | Given                           | When                                                                                                         | Then                                                                                |
| ---- | ------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | --- | --- | --- | -------------------------------------------------------- |
| SW-1 | A timeline row at rest          | Horizontal swipe `dx` past the activation threshold (≈56 px or ≥40% of the delete button width) then release | Row latches **open**, revealing a labelled `刪除` button                            |
| SW-2 | A row mid-swipe below threshold | Release                                                                                                      | Row animates back to `translateX(0)`; **nothing deleted**                           |
| SW-3 | A row latched open              | Tap the revealed `刪除` button                                                                               | `onDelete(ev.id)` is called once; row removed; derived summaries recompute (FR-005) |
| SW-4 | One row open                    | Another row is swiped/opened                                                                                 | The first row closes (at most one open — FR-003)                                    |
| SW-5 | A row at rest                   | A predominantly **vertical** drag (`                                                                         | dy                                                                                  | >   | dx  | `)  | Treated as list scroll; delete is **not** armed (FR-004) |
| SW-6 | A row latched open              | Tap elsewhere / scroll away                                                                                  | Row closes without deleting                                                         |
| SW-7 | The long-press gesture          | Press and hold a row (any duration)                                                                          | **No** delete affordance appears (long-press removed — FR-001)                      |

**Notes**: direction is locked on the first move past a small dead-zone. The delete
button itself must meet the touch floor (§2). Deleting the last row returns the timeline
to its empty state (edge case).

## 2. Glove-friendly touch floor (FR-006..FR-008, FR-010)

**Tokens**: `--ohca-touch-min: 56px`, `--ohca-touch-gap: 8px` (single source of truth).

| ID   | Control                                                                                                                                                | Contract                                                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| TT-1 | Every interactive control (tiles, keypad keys, sheet buttons, status buttons, theme toggle, rhythm/AED buttons, segmented toggle, swipe-delete button) | Effective hit area ≥ `--ohca-touch-min` in both axes                                                                                                |
| TT-2 | Adjacent interactive controls                                                                                                                          | Spacing ≥ `--ohca-touch-gap`                                                                                                                        |
| TT-3 | Known deltas to fix                                                                                                                                    | `RhythmPicker` 54→≥56; `Seg` gains a glove size (≥56) for the AED toggle; audit `NumPad`, `StatusBtn`, `ThemeToggle`, `Sheet`/`DefibSheet` controls |
| TT-4 | Rapid repeated gloved taps                                                                                                                             | Each intended tap registers; a single contact does not double-count (FR-008)                                                                        |
| TT-5 | Holds in all layouts                                                                                                                                   | The floor holds in portrait **and** landscape/wide (FR-010)                                                                                         |

**Test note**: jsdom has no layout engine — assert declared `min-height`/`min-width`/
token usage and gap props on rendered controls rather than measured pixels.

## 3. Simplified AED rhythm mode (FR-012..FR-016)

**Component**: `RhythmPicker` (within the existing 心律分析 `Sheet`).

| ID    | Given                     | When                                                   | Then                                                                                                                                                               |
| ----- | ------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AED-1 | Rhythm sheet open         | View the top of the sheet                              | A `進階 ACLS ⇄ 簡易 AED` toggle is shown (FR-012)                                                                                                                  |
| AED-2 | `進階 ACLS` selected      | View options                                           | The existing 5-rhythm picker (VF/pVT/PEA/Asystole/ROSC) with the `可電擊` badge (FR-012)                                                                           |
| AED-3 | `簡易 AED` selected       | View options                                           | Two large buttons: `建議電擊（可電擊節律）` and `不建議電擊（不可電擊節律）` (FR-013)                                                                              |
| AED-4 | `簡易 AED` mode           | Tap `建議電擊` or `不建議電擊`                         | `setRhythm(label)` records a `rhythm` event with coarse label `可電擊…`/`不可電擊…`; shockable outcomes marked; **no** specific rhythm classified (FR-013, FR-016) |
| AED-5 | Just tapped `建議電擊`    | A one-tap `已電擊` confirm is offered and **accepted** | `logDefib()` records a shock; shock count increments (FR-014)                                                                                                      |
| AED-6 | Just tapped `建議電擊`    | The `已電擊` confirm is **declined**                   | Coarse rhythm remains recorded; **no** shock logged (FR-014)                                                                                                       |
| AED-7 | Any mode chosen           | App reloaded/relaunched                                | Sheet opens in the last-used mode; absent any prior choice → `進階 ACLS` (FR-015)                                                                                  |
| AED-8 | A coarse outcome recorded | Inspect stored event / derivations                     | `rhythm` value is exactly `可電擊…`/`不可電擊…`, never a specific rhythm key; `initialRhythm`/`lastRhythm` treat it uniformly (FR-016)                             |

**Guardrail (non-negotiable)**: AED outcome stores only 可電擊/不可電擊 and is never
back-mapped to VF/pVT/etc.

## Persistence contract (rhythm mode — FR-015)

| ID   | Given                               | When                   | Then                                                          |
| ---- | ----------------------------------- | ---------------------- | ------------------------------------------------------------- |
| PR-1 | No stored preference                | App opens rhythm sheet | Mode = `進階 ACLS` (default)                                  |
| PR-2 | Operator flips to `簡易 AED`        | Toggle changes         | `ohca.rhythmMode` written immediately                         |
| PR-3 | `ohca.rhythmMode = 簡易 AED`        | Reload                 | Sheet opens in `簡易 AED`                                     |
| PR-4 | A new case is started (`newCase()`) | Case cleared           | `ohca.rhythmMode` is **unchanged** (separate from case state) |
| PR-5 | Corrupt/unknown stored value        | App reads preference   | Falls back to `進階 ACLS`; no throw                           |
