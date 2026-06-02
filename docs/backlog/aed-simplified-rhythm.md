# Backlog: Simplified AED rhythm-analysis mode

**Status**: ✅ REALIZED by feature 002 (`specs/002-touch-ux-aed-mode/`). Implemented as
the 進階 ACLS ⇄ 簡易 AED toggle in the rhythm sheet; see ADR
`docs/adr/0005-aed-coarse-rhythm-mode.md`. Original requirements captured 2026-06-02 and
retained below for history.
**Likely path**: ~~a future `/speckit-specify` increment (feature 002)~~ — done in feature 002.

## Goal

Add a **simplified AED mode** to the rhythm-analysis input so less-trained / BLS /
public-setting rescuers (audience option 乙) can record a binary shock decision instead
of classifying a specific ACLS rhythm. Today the rhythm picker requires choosing one of
VF / pVT / PEA / Asystole / ROSC, which assumes ECG interpretation skill.

## Agreed design (direction A — mode switch + coarse data)

- **Mode toggle** at the top of the 心律分析 sheet (reuse the `Seg` control):
  `進階 ACLS ⇄ 簡易 AED`.
- **Simplified AED mode = two large buttons**:
  - 🟧 `建議電擊（可電擊節律）` — shockable
  - ⬜ `不建議電擊（不可電擊節律）` — not shockable
- **Advanced ACLS mode** keeps the current 5-rhythm picker with the 可電擊 badge.

## Decisions (from discussion)

1. **Default mode**: open in **進階 ACLS**, and **remember the user's last-used mode**
   (needs a small persisted UI preference, e.g. a `localStorage` key separate from the case).
2. **Defib shortcut**: after choosing **建議電擊**, **auto-pop a quick "已電擊" confirm**
   so the shock can be logged in one tap (AEDs deliver a fixed energy). Declining still
   leaves the rhythm recorded.
3. **Process**: requirements recorded first; whether to do it as a small change to
   feature 001 or a full `/speckit-specify` 002 is **deferred**.

## Data model (minimal change)

- Add `AED_OUTCOMES` to `src/domain/constants.ts`:
  - `{ key: 'shock',   label: '可電擊 AED建議電擊',   shockable: true }`
  - `{ key: 'noshock', label: '不可電擊 AED不建議電擊', shockable: false }`
- Reuse `setRhythm(label)` → same `rhythm` event kind. Timeline and `initialRhythm` /
  `lastRhythm` derivations are unchanged. The summary "心律" cell shows the short token
  (`可電擊` / `不可電擊`) via the existing `.split(' ')[0]` logic.

## Clinical guardrail (non-negotiable)

The AED outcome stores ONLY coarse "可電擊 / 不可電擊". It MUST NOT be back-mapped to a
specific rhythm (e.g. inferring VF) — that would fabricate data the rescuer never observed.

## Likely touch points

- `src/domain/constants.ts` (add AED_OUTCOMES)
- `src/components/RhythmPicker.tsx` (mode toggle + AED buttons + remembered preference)
- defib quick-confirm wiring (RhythmPicker → existing `logDefib`)
- tests (mode switch, coarse rhythm recorded, defib shortcut)
- `docs/ui/tactical-hud.md` + an ADR (constitution III/V)

## Open question for later

- Where to persist the remembered mode (standalone preference vs part of theme/settings).
