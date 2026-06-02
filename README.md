# OHCA Field Timer — Tactical HUD

An offline-first Progressive Web App (PWA) that helps a single rescuer time and
record an **out-of-hospital cardiac arrest (OHCA)** resuscitation in the field.
It presents a high-contrast "Tactical HUD" interface with large, glanceable
timers, one-tap action logging, drug-interval reminders, and a live treatment
timeline — all running entirely on the device with no network required.

🌐 **Live app:** https://swim-fish.github.io/ohca-field-timer/

繁體中文說明請見 [README_zh.md](./README_zh.md)。

> [!WARNING]
> **Not a certified medical device.** This is a timing and record-keeping aid.
> Drug intervals, CPR cycle length, and rhythm guidance follow the reference
> design's defaults and are **not a substitute for clinical judgement, local
> protocols, or ACLS training**. The operator is responsible for all clinical
> decisions and for the patient data stored on the device.

## Features

- **Master case clock** — auto-starts the moment the app opens, counts up in
  `mm:ss` (extends to hours past 60 min), and the start time can be adjusted to
  backfill the real time of arrest; all event offsets recompute accordingly.
- **CPR cycle timer** — 2-minute compression countdown with cycle counter,
  progress bar, a distinct warning in the final 15 seconds, and auto-rollover.
- **Drug interval reminders** — one-tap Epinephrine (3-min) and Amiodarone
  (4-min) dosing with running counts and a "due" pulse when an interval elapses.
- **Defibrillation** — record shocks at selectable energy levels
  (150 / 200 / 250 / 300 / 360 J) with a live shock count.
- **Clinical capture** — analyzed rhythm (VF / pVT / PEA / Asystole / ROSC) with
  shockable rhythms flagged, airway device + ETT size, IV/IO access, and vital
  signs entered on a gloved-hand numeric keypad with auto-derived MAP.
- **Live treatment timeline** — reverse-chronological log with time-of-day and
  elapsed offset per entry; long-press to delete a mis-tap and every summary
  counter stays consistent (single source of truth).
- **Milestones & reset** — declare ROSC and hospital arrival (the master clock
  keeps running); start a new case with explicit confirmation.
- **Offline & installable** — works fully offline after first load, installs to
  the home screen, and restores an in-progress case after reload or relaunch.
- **Day/night mode** — high-contrast dark "command center" by default, with a
  light mode toggle.

All user-facing text is in Traditional Chinese (zh-Hant), matching the field
design.

## Tech stack

- **TypeScript** (strict) + **React 18** + **Vite**
- **vite-plugin-pwa** — offline-first service worker, installable manifest
- **localStorage** — on-device case persistence (no server, no account, no sync)
- **Vitest** + **React Testing Library** — TDD unit and component tests
- **Prettier** — formatting
- Deployed to **GitHub Pages** via GitHub Actions

## Getting started

Requires Node.js 20+.

```bash
npm install        # install dependencies
npm run dev        # start the Vite dev server
```

### Useful scripts

| Script                 | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Start the dev server with hot reload             |
| `npm run build`        | Type-check (`tsc --noEmit`) and build to `dist/` |
| `npm run preview`      | Preview the production build locally             |
| `npm run test`         | Run Vitest in watch mode                         |
| `npm run test:run`     | Run the test suite once                          |
| `npm run coverage`     | Run tests with a coverage report                 |
| `npm run format`       | Format the codebase with Prettier                |
| `npm run format:check` | Verify formatting (used in CI)                   |

## Project structure

```
src/
  App.tsx              # Top-level app shell and layout
  components/          # Tactical HUD UI (tiles, timeline, pickers, keypad, …)
  domain/              # Pure logic: types, constants, derivation, formatting, useOHCA hook
  persistence/         # localStorage case store
  theme/               # Design tokens and day/night theme
  styles/              # Global styles
tests/                 # Vitest unit + component tests
specs/                 # Feature spec, plan, and design reference (source of truth)
```

## Deployment

Pushes to `main` trigger the **Deploy to GitHub Pages** workflow
(`.github/workflows/deploy.yml`), which checks formatting, runs the test suite,
builds, and publishes to GitHub Pages. The Vite `base` is set to
`/ohca-field-timer/` to match the Pages path.

## Privacy

All data stays on the device. There is no account, login, backend, or cloud
sync. An in-progress case is retained locally until a new case is started or the
record is manually cleared — clearing the record is the operator's
responsibility for on-device privacy.

## License

Released under the [MIT License](./LICENSE).
