# Quickstart: Tactical HUD OHCA Field Timer

Offline-first TypeScript PWA (Vite + React 18). Deployed to GitHub Pages.

## Prerequisites

- Node.js 20+ and npm
- Git

## Setup

```bash
npm install
```

## Develop

```bash
npm run dev          # Vite dev server (http://localhost:5173)
```

The app auto-starts a case on open. To exercise offline behavior, build and preview
(the service worker is only active in a production build):

```bash
npm run build
npm run preview      # serves dist/ with the service worker
```

## Test (TDD — constitution Principle II)

```bash
npm test             # Vitest watch (red-green-refactor)
npm run test:run     # single CI run
npm run coverage     # coverage report
```

Test layout:
- `tests/unit/` — pure domain logic: derivations, MAP, countdown/CPR math (vitest
  fake timers), persistence load/save/clear.
- `tests/component/` — React Testing Library: tile taps, numpad entry, vitals commit,
  timeline long-press delete, theme toggle, restore-from-storage.

Write the failing test first, watch it fail, then implement. See
`contracts/state-contract.md` for the invariants to assert.

## Format & lint (constitution Principle I)

```bash
npm run format       # prettier --write
npm run format:check # prettier --check (CI gate)
```

A format hook auto-formats changed files on write/commit; CI runs `format:check`.

## Build & deploy (GitHub Pages)

- `vite.config.ts` sets `base: '/ohca-field-timer/'` (the repo subpath) so asset and
  service-worker paths resolve under GitHub Pages.
- `.github/workflows/deploy.yml` runs install → `format:check` → `test:run` → `build`
  → upload `dist/` → deploy to Pages on push to the default branch.
- A `404.html` (copy of `index.html`) provides SPA fallback on GitHub Pages.

Manual one-off:

```bash
npm run build        # outputs dist/ with manifest + service worker
```

## Local testing (real PWA on this machine + a phone)

The service worker is only active in a production build, so use the local test
command — it builds and serves the real PWA on localhost **and** the LAN so you can
open it on a phone for real-device verification:

```bash
npm run serve   # vite build && vite preview --host
```

Vite prints a `Local:` and a `Network:` URL; open the Network URL on a phone on the
same Wi-Fi. (`npm run dev` is for fast iteration but has no service worker.)

## Verify offline + install

1. `npm run serve`.
2. Load once, then disable the network → reload → app still works (FR-019).
3. Install to home screen (browser install prompt / Add to Home Screen).
4. Log events, reload mid-case → case + timeline restored (FR-020).

## Performance budget check (constitution Principle IV)

- App JS (gzipped) ≤ 150 KB — inspect Vite build output / `rollup-plugin-visualizer`.
- Time-to-interactive < 2s over cache after first load.
- Confirm the elapsed clock shows no drift over a long case (derived from a stored
  timestamp, not tick accumulation).
