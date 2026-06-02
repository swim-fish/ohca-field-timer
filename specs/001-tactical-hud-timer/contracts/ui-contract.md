# UI Contract: Tactical HUD screen

Recreate the Tactical HUD (`design-reference/project/variant-tactical.jsx`) pixel-
faithfully. This contract defines observable UI behavior for component tests; visual
tokens live in `docs/ui/tactical-hud.md`.

## Layout (top → bottom, single scroll column, dark default)

1. **Command bar** (sticky, blurred):
   - Status dot + label: pulsing red `OHCA · CPR 進行中`, or green `ROSC · 恢復循環`.
   - Master elapsed clock (mono, ~42px) `mm:ss` / `h:mm:ss`; label `經過`.
   - `現在 HH:MM:SS` time-of-day; tapping the clock opens **start-time adjust** (FR-001).
   - Theme toggle pill (🌙夜間 / ☀️白天).
2. **CPR bar**: when inactive shows `開始` button; when active shows `第 N 輪`, a mono
   `mm:ss` countdown, and a depleting progress bar. Within 15s: orange glow + border +
   `⚠ 準備換手 · 心律檢查`.
3. **Status actions** (row of 3): `ROSC` (green), `到達醫院` (deep-red), `新案件`
   (neutral). ROSC/arrival become filled+labeled-with-time once set; new case confirms
   then resets.
4. **Drug/action tiles** (2-col grid, 6 tiles): Epinephrine, Amiodarone, Defib, IV/IO,
   Rhythm, Airway — each shows kicker, big value, sub-line, accent dot.
5. **Vitals HUD**: 3-col grid of 6 cells (SBP, DBP, HR, SpO₂, EtCO₂, Temp); MAP pill +
   ECG note input; commit button appears when any field has a draft value.
6. **Stats strip** (4 mini-stats): 電擊, Epi, Amio, 心律.
7. **Timeline**: empty-state text, or reverse-chronological rows.
8. **Sheets**: NumPad, RhythmPicker, AirwayPicker, DefibSheet (bottom sheets).

## Behavioral contract (testable interactions)

| Interaction                        | Expected result                                                   | Req            |
| ---------------------------------- | ----------------------------------------------------------------- | -------------- |
| Open app                           | Elapsed clock visible and advancing within 2s, no setup           | SC-001, FR-001 |
| Tap clock → set new start time     | Elapsed + all row offsets recompute                               | FR-001         |
| Tap Epinephrine tile               | count→+1; tile shows `mm:ss` countdown from 3:00; sub `已給 N 劑` | FR-003         |
| Epi countdown reaches 0            | tile shows `可給藥` and pulses until next dose                    | FR-003         |
| Tap Amiodarone tile                | count→+1; countdown from 4:00                                     | FR-004         |
| Tap Defib tile → choose 200J       | shock count +1; defib event with energy logged                    | FR-005         |
| Tap IV/IO tile                     | shows `已建立`; `iv` event logged                                 | FR-006         |
| Tap Rhythm → pick VF               | rhythm recorded; shockable badge shown in picker                  | FR-007         |
| Tap Airway → ETT → size 7.5        | airway recorded with size; tile shows device + 管徑               | FR-008         |
| Tap vitals cell → keypad → 確定    | value captured into draft; cell shows value                       | FR-009         |
| Enter SBP+DBP                      | MAP pill shows `round(dia+(sys-dia)/3)`                           | FR-009         |
| Tap commit vitals                  | timestamped vitals row added; draft cleared                       | FR-010         |
| Start CPR                          | countdown from 2:00, `第 1 輪`, progress depletes                 | FR-002         |
| CPR ≤ 15s                          | warning text + orange styling shown                               | FR-002         |
| CPR reaches 0                      | rolls to `第 2 輪`, countdown restarts                            | FR-002         |
| Tap ROSC                           | status → green ROSC, time recorded, clock keeps running           | FR-014         |
| Tap 到達醫院                       | arrival recorded with time                                        | FR-014         |
| Long-press a timeline row (~550ms) | `刪除` button arms; tap deletes; stats update                     | FR-013/016     |
| Release long-press early           | no delete armed                                                   | Edge case      |
| Tap 新案件 → confirm               | timers/milestones/events reset                                    | FR-015         |
| Toggle theme                       | switches dark/light tokens across screen                          | FR-017         |
| Reload mid-case                    | case + events restored from storage                               | FR-020         |
| Network disabled after first load  | app launches and all actions work                                 | FR-019         |

## Accessibility / field-use (Principle III)

- Touch targets ≥ 44px; numeric keypad keys ≥ 56px (gloved hands).
- High contrast; large mono numerals for all timers/counters.
- Theme toggle and status dot expose `aria-label`s.
- All visible text in Traditional Chinese (FR-021).
