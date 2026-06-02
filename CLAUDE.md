<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/002-touch-ux-aed-mode/plan.md`

Active feature: **Touch Ergonomics & AED Mode Improvements** (branch
`002-touch-ux-aed-mode`) — builds on the **Tactical HUD OHCA Field Timer**
(`001-tactical-hud-timer`). This increment: swipe-to-reveal timeline delete
(replaces long-press), a glove-friendly touch floor (≥56×56 px, ≥8 px gap),
adaptive portrait/landscape+wide layout, and a 進階 ACLS ⇄ 簡易 AED rhythm-mode
toggle (coarse 可電擊/不可電擊, one-tap 已電擊 shortcut, remembered mode).
Stack: TypeScript (strict) + React 18 + Vite, vite-plugin-pwa (offline-first),
localStorage persistence, Vitest + React Testing Library (TDD), Prettier, deployed
to GitHub Pages. Spec: `specs/002-touch-ux-aed-mode/spec.md`. Prior feature spec &
design source of truth: `specs/001-tactical-hud-timer/` (incl. `design-reference/`).
<!-- SPECKIT END -->
