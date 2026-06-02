# UI Design: Tactical HUD

The OHCA field timer uses the **Tactical HUD** direction — a dark-first command
center optimized for high-stress, single-handed field use. This document records the
visual system and interaction rules so future changes stay consistent (constitution
Principle III). Source of truth for the original mock: `specs/001-tactical-hud-timer/design-reference/`.

## Layout (single scroll column, phone-first)

1. **Command bar** (sticky, blurred) — pulsing status dot + label, large mono elapsed
   clock (tap to adjust start time), time of day, theme toggle.
2. **CPR bar** — start button → 2-minute countdown with cycle number, depleting
   progress bar, and an orange "⚠ 準備換手 · 心律檢查" warning in the final 15 s.
3. **Status actions** — ROSC (green), 到達醫院 (deep-red), 新案件 (neutral, confirms).
4. **Drug/action tiles** — 2-column grid: Epinephrine, Amiodarone, Defib, IO/IV,
   心律分析, 氣道處置.
5. **Vitals HUD** — 3-column cells + MAP pill + ECG note + commit button.
6. **Stats strip** — 電擊 / Epi / Amio / 心律 mini-stats (derived).
7. **Timeline** — reverse-chronological treatment log; long-press a row to delete.

## Color tokens (semantic, FR-018)

| Use            | Color                |
| -------------- | -------------------- |
| Epinephrine    | `#E5484D` (red)      |
| Amiodarone     | `#0E9C9C` (teal)     |
| Defibrillation | `#F0883E` (orange)   |
| IO/IV          | `#C08A2E` (amber)    |
| Rhythm         | `#6E56CF` (indigo)   |
| Airway         | `#9F5BD6` (purple)   |
| Vitals         | `#3E63DD` (blue)     |
| ROSC           | `#1FA463` (green)    |
| Arrival        | `#9B1C2E` (deep red) |
| Note           | `#7A8290` (neutral)  |

Theme tokens (background, surfaces, text, lines, accent) live in `src/theme/tokens.ts`
for both `dark` (default) and `light`. The accent drives primary buttons and progress.

## Typography

- **Numerals / timers**: JetBrains Mono (`--ohca-mono`), tabular, large, negative
  letter-spacing for glanceability.
- **Chinese / Latin labels**: Noto Sans TC (`--ohca-sans`).

## Interaction & accessibility rules

- All visible copy is Traditional Chinese (zh-Hant) — FR-021.
- Touch targets ≥ 44 px; numeric keypad keys ≥ 56 px (gloved hands).
- Drug countdowns are **reminders, never locks** — logging is always allowed.
- A drug tile **pulses** ("可給藥") once its interval elapses.
- Long-press (~550 ms) arms a delete; an early release does nothing.
- ROSC / arrival change status only — the elapsed clock keeps running.
- `aria-label`s on the status dot, theme toggle, keypad keys, start-time control,
  the MAP readout, and the summary group.

## Changing the UI

Any change to layout, color, type, or interaction MUST update this document in the
same change set (Principle III), and recreate behavior faithfully against
`contracts/ui-contract.md`.
