# ADR 0001: Tech stack — Vite + React 18 + TypeScript + PWA

- **Status**: Accepted
- **Date**: 2026-06-02
- **Feature**: 001-tactical-hud-timer

## Context

The OHCA field timer must be an offline-first PWA deployable to GitHub Pages
(constitution Principle IV), in TypeScript strict mode (Principle I), built test-first
(Principle II). The Claude Design handoff prototype is already React 18 + hooks.

## Decision

- **Vite** as the build tool — fast dev server, static output for GitHub Pages, first-class
  PWA support.
- **React 18 + TypeScript (strict)** — the prototype ports directly; strict typing per
  constitution.
- **vite-plugin-pwa (Workbox)** — generates the service worker and web app manifest;
  `registerType: 'autoUpdate'` so a stale cache cannot linger in a field tool.
- **localStorage** for persistence (not IndexedDB) — the entire case state is a single
  small JSON object; async storage adds complexity for no benefit. See ADR 0002.
- **Vitest + React Testing Library** (jsdom, fake timers) for TDD.
- **Prettier** as the formatting source of truth, enforced in CI.
- **GitHub Pages via GitHub Actions** with Vite `base: '/ohca-field-timer/'`.

## Consequences

- The manifest `start_url`, `scope`, and icon `src` must all carry the `/ohca-field-timer/`
  subpath prefix, or iOS refuses to install and the service worker falls out of scope.
  Verified in `vite.config.ts`; must be confirmed on a real device (tasks T042/T069).
- Timers derive elapsed time from a stored wall-clock timestamp (`now - caseStart`),
  not tick accumulation, so background/locked tabs stay accurate (see ADR 0002).
- Production bundle is ~55 KB gzipped, within the ≤ 150 KB budget.

## Alternatives considered

- **Next.js** — SSR/server features are unnecessary for a static offline SPA; heavier.
- **IndexedDB / a state library (Redux/Zustand)** — overkill for one small case object
  and a single derived store.
