# Quickstart: Touch Ergonomics & AED Mode Improvements

This feature extends the existing app; the toolchain is unchanged from feature 001.

## Prerequisites

- Node 24.x (matches CI), npm
- Repo dependencies installed: `npm install`

## Run

```bash
npm run dev        # Vite dev server
npm run build      # production build (PWA)
npm run preview    # serve the built PWA locally
```

## Test (TDD — Principle II)

```bash
npm test           # Vitest watch
npm run test:run   # single run (CI)
npx prettier --check .   # formatting gate (Principle I)
```

Write each test first and watch it fail (Red) before implementing (Green), then refactor.

### New test files for this feature

| File | Covers | Contract |
|------|--------|----------|
| `tests/component/timelineSwipeDelete.test.tsx` | swipe reveal / partial snap-back / tap-delete / one-open / direction lock / no long-press | interaction §1 |
| `tests/component/touchTargets.test.tsx` | every primary control ≥56×56, ≥8 px gap | interaction §2 |
| `tests/component/rhythmAedMode.test.tsx` | toggle, AED buttons, 已電擊 shortcut accept/decline, remembered mode | interaction §3 |
| `tests/component/responsiveLayout.test.tsx` | portrait single-col vs wide two-zone; state survives rotation | responsive RL-1..RL-4 |
| `tests/unit/prefStore.test.ts` | rhythm-mode read/write/default/corrupt-fallback | interaction PR-1..PR-5 |
| `tests/unit/aedOutcomes.test.ts` | coarse labels, shockable flags, never a specific rhythm | data-model guardrail |

`tests/setup.ts` gains a `matchMedia` mock (and, if needed, `setPointerCapture` no-ops).

## Manual verification (the four changes)

1. **Swipe-delete**: log a few events; swipe a timeline row sideways → `刪除` appears;
   tap it → row gone and 處置摘要 counts drop. Partial swipe → snaps back. Vertical
   scroll never reveals delete. Long-press does nothing.
2. **Glove touch floor**: every tappable control is ≥56×56 with visible spacing; nothing
   feels cramped with a thick fingertip.
3. **Responsive**: rotate a phone to landscape / open on a tablet → timers/actions sit
   beside a persistent timeline, no empty gutters; rotate back → single column; elapsed
   clock and counts never reset across rotation.
4. **AED mode**: open 心律分析 → flip to 簡易 AED → tap 建議電擊 → coarse `可電擊` recorded
   and a one-tap 已電擊 confirm logs a shock; flip to 進階 ACLS → 5-rhythm picker returns;
   reload → sheet reopens in the last-used mode; start a new case → mode is retained.

## Quality gates before done (constitution)

- [ ] All new/changed tests written test-first, observed failing, now passing
- [ ] `npx prettier --check .` clean
- [ ] `docs/ui/tactical-hud.md` updated (swipe-delete, touch floor, responsive, AED toggle)
- [ ] ADRs added: `0004-swipe-delete-over-long-press.md`, `0005-aed-coarse-rhythm-mode.md`
- [ ] Offline still works after build; 001 performance budgets still met
- [ ] Mixed Sonnet+Opus review for non-trivial changes

## Deploy

Unchanged — push to the branch; GitHub Actions builds and deploys to GitHub Pages
(`.github/workflows/deploy.yml`). Verify the installed PWA still launches offline.
