# Technology Research: Tactical HUD OHCA Field Timer

**Feature**: 001-tactical-hud-timer  
**Date**: 2026-06-02  
**Status**: Approved — stack is decided; this document justifies choices and surfaces
implementation gotchas.

---

## 1. Build Tool & Framework (Vite + React 18 + TypeScript strict)

- **Decision**: Vite as the build tool, React 18 as the UI framework, TypeScript with
  `compilerOptions.strict: true` throughout.

- **Rationale**: The prototype is already React 18 (hooks, functional components, derived
  state via `useMemo`/`useState`). A direct port preserves the exact architecture without
  a rewrite. Vite produces highly optimized static bundles via Rollup, fits GitHub Pages
  (pure static output), and provides near-instant HMR during development — important for
  a UI that needs frequent visual iteration. TypeScript strict mode is non-negotiable per
  the constitution (Principle I): it eliminates a class of runtime defects in time-critical
  clinical logic (e.g., null `caseStart`, mistyped event `kind` strings). `any` is banned
  except with an explicit justified comment.

- **Alternatives considered**:
  - **Next.js / Remix**: Server-rendering overhead is irrelevant for a fully static offline
    PWA; the added complexity of SSR/SSG with a GitHub Pages deploy is not justified.
  - **Svelte / SolidJS**: Would require a full rewrite of the React prototype with no
    functional gain. The existing `useOHCA` hook maps cleanly to a typed React custom hook.
  - **Create React App**: Deprecated upstream; Vite is the modern equivalent with better
    performance and active maintenance.

---

## 2. PWA / Service Worker Strategy (vite-plugin-pwa, Workbox, Offline App Shell)

- **Decision**: `vite-plugin-pwa` (Workbox under the hood) with `registerType: 'autoUpdate'`,
  `injectRegister: 'auto'`, and a Workbox `precacheAndRoute` strategy covering the entire
  app shell. The web app manifest declares `display: 'standalone'`, `orientation: 'portrait'`,
  and appropriate `theme_color`/`background_color` for the dark-first HUD.

- **Rationale**: FR-019 and SC-006 mandate 100% offline operation after first load.
  vite-plugin-pwa integrates directly with Vite's build output, automatically generating
  the Workbox precache manifest from the Rollup-emitted asset list — no manual maintenance
  of cache lists. Because all app state is local (localStorage, no backend), precaching
  the app shell is sufficient: the entire app is static files plus fonts.

- **`registerType: 'autoUpdate'`**: For a field emergency tool, a stale service worker
  cache is a patient-safety concern — an outdated drug interval or countdown bug could
  persist for days. `autoUpdate` causes the new service worker to activate immediately on
  the next page load without requiring user confirmation. This is preferred over `'prompt'`
  for this use case. Teams MUST ensure deployments to GitHub Pages are intentional and
  tested, since updates will auto-apply on next app open.

- **Font caching**: Noto Sans TC and JetBrains Mono are loaded from Google Fonts CDN. The
  Workbox runtime cache strategy `CacheFirst` with a `StaleWhileRevalidate` fallback should
  be configured for the `fonts.googleapis.com` and `fonts.gstatic.com` origins so fonts
  are available offline after first load.

- **Gotcha — non-root `base` path (GitHub Pages subpath)**:
  - Vite's `base` must be set to the repository subpath, e.g. `base: '/ohca-field-timer/'`.
  - `vite-plugin-pwa` reads `base` automatically and prefixes all precache URLs, but the
    **web app manifest** fields `start_url` and `scope` must be explicitly set to match:
    ```js
    // vite.config.ts
    VitePWA({
      base: '/ohca-field-timer/',
      manifest: {
        start_url: '/ohca-field-timer/',
        scope: '/ohca-field-timer/',
        // icon src paths must also be relative or use the base prefix
      }
    })
    ```
  - Icon `src` paths in the manifest must be absolute from the repo root (e.g.
    `/ohca-field-timer/icons/icon-192.png`), not bare filenames, or the browser will
    resolve them against the origin root and fail on the subpath.
  - Failing to set `scope` correctly causes "out of scope" errors when the user navigates
    and the service worker will not intercept those requests.

- **iOS Safari PWA quirks**: iOS Safari honors the web app manifest's `display: 'standalone'`
  via `<meta name="apple-mobile-web-app-capable" content="yes">` which vite-plugin-pwa
  injects. The splash screen and icon require `apple-touch-icon` link tags. These are
  configurable via the plugin's `includeAssets` and `manifest.icons` options.

- **Alternatives considered**:
  - **Hand-written service worker**: More control but significant maintenance burden;
    vite-plugin-pwa's Workbox integration covers all required patterns (precache, runtime
    cache for fonts) with minimal config.
  - **Workbox CLI directly**: Does not integrate with Vite's build pipeline; requires a
    separate post-build step that can drift out of sync.

---

## 3. GitHub Pages Deployment & Vite Base Path

- **Decision**: Deploy via GitHub Actions on push to `main`. The workflow runs
  `vite build` and pushes the `dist/` output to the `gh-pages` branch (or uses the
  `actions/deploy-pages` action). `vite.config.ts` sets `base: '/ohca-field-timer/'`.

- **Rationale**: GitHub Pages is the only deployment target per the constitution
  (Technology & Platform Constraints). GitHub Actions automates the build and deploy on
  every merge to `main`, ensuring the deployed version always matches the branch.

- **Base path**: GitHub Pages project sites are served at
  `https://<user>.github.io/<repo>/`. Vite must know this subpath at build time to emit
  correct asset URLs. Setting `base` in `vite.config.ts` (or via the `VITE_BASE_PATH`
  env var in CI) is the canonical approach. The same value must propagate to vite-plugin-pwa
  (see section 2).

- **SPA 404 fallback**: This app is a single-page application with no server-side routing.
  GitHub Pages does not natively support SPA fallback routing. Mitigations:
  - Since there is only one route (the app is a single screen, no URL-based routing),
    no `404.html` hack is needed for this feature.
  - If URL-based navigation is introduced in a future feature, the standard approach is
    to copy `index.html` to `404.html` in the build output, and use a redirect script
    — but this is out of scope for the current feature.

- **Environment variable pattern for base path**:
  ```yaml
  # .github/workflows/deploy.yml
  - name: Build
    run: npm run build
    env:
      VITE_BASE_PATH: /ohca-field-timer/
  ```
  ```ts
  // vite.config.ts
  base: process.env.VITE_BASE_PATH ?? '/',
  ```
  This keeps local dev working at `http://localhost:5173/` (base `/`) while the CI build
  uses the correct subpath.

- **Alternatives considered**:
  - **Netlify / Vercel**: Not available as the deployment target is specifically GitHub Pages.
  - **Manual deploy**: Error-prone and does not meet the "automated quality gates before
    merge" requirement of the constitution.

---

## 4. Local Persistence (localStorage vs IndexedDB)

- **Decision**: `localStorage` with JSON serialization of the single case state object.
  Autosave on every state change; restore on app load. The persisted shape mirrors the
  `useOHCA` return value's mutable fields: `{ caseStart, rosc, arrived, cpr, events }`.

- **Rationale**:
  - **Data size**: A single resuscitation case generates at most tens of events over
    60 minutes. The serialized JSON is well under 10 KB — a rounding error relative to
    the 5–10 MB localStorage quota on all modern mobile browsers.
  - **Data shape**: The state is a flat object with one array. There is no need for
    queries, indices, cursors, or transactions — all access is full-read / full-write of
    the single case. IndexedDB's asynchronous, transaction-based API adds significant
    complexity for zero functional gain at this data size.
  - **FR-020**: "Retained indefinitely until a new case is started or manually cleared."
    localStorage satisfies this: data persists across sessions, is never evicted by the
    browser under normal conditions (unlike Cache Storage under storage pressure), and is
    cleared only by explicit code (`localStorage.removeItem`) or the user clearing site
    data.
  - **Synchronous API**: localStorage's synchronous read/write fits the hook-based React
    state model without async complexity. The write completes before the next render.

- **Serialization**: `JSON.stringify` / `JSON.parse`. Timestamps are stored as Unix
  milliseconds (numbers), which survive the round-trip without precision loss. The
  `events` array is stored as-is. No custom serializer is needed.

- **Autosave pattern**:
  ```ts
  // Inside useOHCA (TypeScript port):
  useEffect(() => {
    localStorage.setItem('ohca_case', JSON.stringify({ caseStart, rosc, arrived, cpr, events }));
  }, [caseStart, rosc, arrived, cpr, events]);
  ```
  Restore on initialization:
  ```ts
  const saved = localStorage.getItem('ohca_case');
  const initial = saved ? JSON.parse(saved) : defaultCase();
  ```

- **Gotcha — localStorage unavailability**:
  - In private/incognito mode on some browsers, `localStorage.setItem` throws a
    `SecurityError` (quota 0). The persistence code MUST wrap writes in a `try/catch`.
    On failure, the app continues without persistence (degraded mode) and should show a
    one-time warning that data will not survive a reload.
  - Storage quota exhaustion is not a realistic concern at this data size, but the
    `try/catch` handles it regardless.

- **Alternatives considered**:
  - **IndexedDB (via idb or Dexie)**: Justified if data volume were large or if queries
    were needed. For a single <10 KB JSON blob, the asynchronous complexity and larger
    dependency weight are unjustified.
  - **sessionStorage**: Does not persist across page reloads or tab closures — violates
    FR-020 directly.
  - **OPFS (Origin Private File System)**: Modern and quota-exempt, but lacks Safari
    support on iOS as of this writing and is over-engineered for this data size.

---

## 5. Time / Clock Architecture

- **Decision**: A single `setInterval` heartbeat fires every 1 second and updates a `now`
  state variable (`Date` object). All elapsed times and countdowns are computed by
  **subtracting a stored wall-clock timestamp** (`caseStart`, `cpr.startAt`, `epiLast`,
  `amioLast`) from `Date.now()` on each tick. Accumulated-tick counters are not used.

- **Rationale**:
  - **Correctness under background/throttle**: iOS Safari and Chrome on Android aggressively
    throttle or pause `setInterval` when the screen locks or the tab is backgrounded.
    A counter that increments by 1 on each tick will lose seconds during lock/background.
    Deriving elapsed time from `Date.now() - caseStart` means: even if the heartbeat skips
    30 ticks while the screen is locked, the display shows the correct elapsed time the
    moment the screen unlocks. This is the pattern used in the prototype (`elapsedSec =
    Math.floor((now.getTime() - caseStart) / 1000)`).
  - **FR-001 adjustable start time**: Because elapsed time is always re-derived from
    `caseStart`, adjusting `caseStart` (e.g., backfilling the actual arrest time)
    immediately recalculates `elapsedSec` and all event elapsed-offsets with no additional
    logic.
  - **SC-008 / Constitution Principle IV**: The 1 s tick is for display refresh only; the
    underlying correctness depends on wall-clock subtraction, not tick accuracy.

- **Heartbeat implementation**:
  ```ts
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  ```
  One interval for the entire app (not per-countdown), minimizing timer proliferation.

- **Derived countdown pattern** (from prototype, ported to TypeScript):
  ```ts
  const epiRemain: number | null =
    epiLast == null ? null : EPI_INTERVAL - (nowMs - epiLast) / 1000;
  ```
  The countdown goes negative when overdue (positive displayed as `+mm:ss` per `fmtClock`),
  which naturally handles the "due / overdue" state without additional flags.

- **iOS Safari background throttling gotcha**: When the PWA is in standalone mode and the
  screen locks, `setInterval` may fire at 1-minute intervals or not at all. The display
  tick will freeze, but elapsed time will be correct when the screen unlocks because the
  wall-clock subtraction self-corrects. The CPR cycle countdown will also self-correct:
  `cprRemain = CPR_CYCLE - ((nowMs - cpr.startAt) / 1000) % CPR_CYCLE`. Teams should
  note that the "15 second warning" (FR-002) may appear late if the screen was locked
  through the warning window — this is an acceptable trade-off given the alternative
  (incorrect elapsed time) is more dangerous.

- **Testing with vitest fake timers**: See section 7.

- **Alternatives considered**:
  - **Accumulating ticks**: Simpler to implement but breaks after any background/lock
    event. Rejected — incorrect under the primary field-use scenario.
  - **Web Workers**: A worker-based timer survives tab throttling more reliably, but adds
    significant architecture complexity and message-passing overhead. The wall-clock
    derivation achieves correctness without a worker.
  - **`requestAnimationFrame` ticks**: Frame rate varies (60 Hz), generates unnecessary
    renders, and is paused in background tabs. Not suitable for 1 s display updates.

---

## 6. State Architecture (Derived State from Events Array)

- **Decision**: Port the `useOHCA` custom hook to TypeScript with strict types. The single
  source of truth is `events: OHCAEvent[]`. All summary values — dose counts, shock count,
  initial/latest rhythm, airway status, IV done, drug countdowns, CPR cycle — are derived
  from the events array on each render. Timer state (`caseStart`, `rosc`, `arrived`,
  `cpr`) is kept as separate state fields because it represents time-series anchors, not
  logged events.

- **Rationale**:
  - **FR-016** is the key requirement: "All summary values MUST be derived from the single
    record of logged events so that any addition or deletion updates the entire interface
    consistently." This is precisely what the `useOHCA` architecture delivers. A long-press
    delete calls `setEvents(list => list.filter(e => e.id !== id))`; on the next render,
    every derived summary (Epi count, initial rhythm, etc.) recomputes from the new array
    with zero additional logic.
  - Derived state eliminates synchronization bugs. There is no separate `epiCount` state
    that could drift from the `events` array — `epiCount` is `events.filter(e => e.kind === 'epi').length`.
  - The pattern maps cleanly to typed React: define a discriminated union `OHCAEvent`
    with a `kind` field, then derive everything via typed array operations.

- **TypeScript type design**:
  ```ts
  type EventKind = 'epi' | 'amio' | 'defib' | 'iv' | 'rhythm' | 'airway' | 'vitals'
                | 'rosc' | 'arrival' | 'note';

  interface OHCAEventBase { id: string; at: number; kind: EventKind; label: string; }
  interface DefibEvent extends OHCAEventBase { kind: 'defib'; joules: number; }
  interface VitalsEvent extends OHCAEventBase { kind: 'vitals'; vitals: VitalsReading; detail: string; }
  // ... etc.
  type OHCAEvent = EpiEvent | AmioEvent | DefibEvent | IVEvent | RhythmEvent
                | AirwayEvent | VitalsEvent | ROSCEvent | ArrivalEvent | NoteEvent;
  ```
  Exhaustive `switch` on `kind` in derived logic provides compile-time guarantees.

- **`useMemo` for derivations**: Derivations that scan the full events array (initial
  rhythm, latest airway, last vitals) should be wrapped in `useMemo` with `events` as
  the dependency to avoid redundant O(n) scans on every render triggered by the 1 s tick.

- **Persistence boundary**: The `useOHCA` hook owns both state and persistence. The
  `useEffect` autosave (section 4) lives inside the hook; consumers see only the returned
  state and actions.

- **Alternatives considered**:
  - **Redux / Zustand**: An external store is not justified for a single-screen app with
    one hook. The `useOHCA` hook already provides the equivalent of a store with actions
    and derived selectors — adding a store library adds dependency weight with no benefit.
  - **Storing derived summaries as state**: Creates synchronization bugs on deletion.
    Rejected per FR-016.

---

## 7. Testing Strategy (Vitest + React Testing Library, TDD)

- **Decision**: Vitest as the test runner (jsdom environment), React Testing Library (RTL)
  for component tests. TDD is mandatory (constitution Principle II): write a failing test,
  confirm it fails, implement the minimum to pass, refactor. Vitest's built-in fake timer
  API (`vi.useFakeTimers()`) is used for all time-dependent logic.

- **Rationale**: Vitest integrates natively with Vite — no separate build configuration.
  It is API-compatible with Jest, so migration effort for teams familiar with Jest is
  negligible. RTL tests components as the user interacts with them (queries by role/text,
  not internal state), making tests resilient to refactoring. The jsdom environment
  provides a DOM without a real browser.

- **What to unit-test (priority order)**:
  1. **Derivation logic** (pure functions, no DOM): `fmtElapsed`, `fmtClock`, `fmtTimeOfDay`,
     `mapOf` (MAP calculation — edge cases: single value, NaN, out-of-range inputs). These
     are the highest-confidence tests.
  2. **`useOHCA` hook logic** via `renderHook`: initial state, `giveEpi` increments count
     and sets countdown, `removeEvent` recalculates all derived values, `newCase` resets
     to clean state, `declareROSC` does not stop elapsed clock, CPR cycle rolls over
     at 120 s.
  3. **Persistence**: `localStorage` read/write round-trip via `useOHCA`; degraded mode
     when `localStorage` throws.
  4. **Component tests** (RTL): CPR bar warning state at ≤15 s remaining, Epi tile pulsing
     when `epiRemain <= 0`, timeline entry delete via long-press, MAP display.
  5. **Countdown / interval accuracy**: Use fake timers to advance time and assert
     `epiRemain` equals `EPI_INTERVAL - elapsed`.

- **Fake timer pattern** (Vitest):
  ```ts
  import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
  import { renderHook, act } from '@testing-library/react';

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('epiRemain decreases as time advances', () => {
    const { result } = renderHook(() => useOHCA());
    act(() => result.current.actions.giveEpi());
    act(() => vi.advanceTimersByTime(60_000)); // advance 60 s
    expect(result.current.epiRemain).toBeCloseTo(120, 0); // 120 s remaining of 180
  });
  ```
  `vi.advanceTimersByTime` triggers the `setInterval` heartbeat the correct number of
  times, driving `setNow(new Date())` which re-derives all elapsed values.

- **TDD cycle enforcement**: Per the constitution, no implementation task is complete
  without tests that were observed to fail first. The CI quality gate runs `vitest run`
  and blocks merge on any failure.

- **Alternatives considered**:
  - **Jest**: Compatible API but requires a separate Babel/ts-jest transform step outside
    Vite's pipeline. Vitest reuses the Vite config (including TypeScript path aliases)
    without extra configuration.
  - **Playwright / Cypress for all tests**: E2E tests are valuable for offline/install
    flows but are slow and not suitable as the primary TDD loop. RTL + Vitest provides
    the fast red-green-refactor cycle required by Principle II.

---

## 8. Styling / Theming Approach

- **Decision**: Port the prototype's inline-style token system to typed TypeScript theme
  objects. Define a `Theme` interface matching the token keys in `OHCA_THEMES` (dark/light).
  Apply tokens via React inline styles or via CSS custom properties injected at the root.
  Fonts Noto Sans TC (UI text) and JetBrains Mono (numeric displays) loaded from Google
  Fonts. Dark mode is the default (FR-017).

- **Rationale**: The prototype already defines a complete, production-quality token system
  in `OHCA_THEMES` (background, surface layers, border colors, text hierarchy, accent).
  Typing this as a `Theme` interface provides autocomplete and prevents typos in token
  names that would silently produce `undefined` in CSS values. The inline-style approach
  avoids a CSS-in-JS runtime dependency and is compatible with the strict TypeScript
  requirement — every style property is a typed string/number.

- **Theme type**:
  ```ts
  interface Theme {
    name: 'dark' | 'light';
    bg: string; bgGrad: string;
    surface: string; surface2: string; raised: string;
    line: string; lineStrong: string;
    text: string; textDim: string; textFaint: string;
    field: string; fieldLine: string;
    accent: string; shadow: string;
  }
  ```

- **CSS custom properties alternative**: CSS variables (`--ohca-bg`, `--ohca-surface`,
  etc.) set on `:root` via a `useEffect` when the theme changes would allow using CSS
  class-based theming instead of passing `t` props everywhere. This reduces prop-drilling
  but requires care to keep the TypeScript type system aware of which variables exist.
  Either approach is acceptable; the inline-style prop-threading approach is used in the
  prototype and is the lower-risk port.

- **Font setup**:
  ```html
  <!-- index.html -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@600;700;800&family=JetBrains+Mono:wght@700;800&display=swap" rel="stylesheet">
  ```
  ```css
  /* index.css — global CSS custom properties used by components */
  :root {
    --ohca-sans: 'Noto Sans TC', sans-serif;
    --ohca-mono: 'JetBrains Mono', 'Noto Sans TC', monospace;
  }
  ```
  The `--ohca-mono` fallback to Noto Sans TC ensures CJK characters in mono contexts
  (e.g., event labels in the timeline `detail` field) render correctly if JetBrains Mono
  lacks the glyph.

- **`ohcaPulse` animation**: The prototype uses a CSS `@keyframes ohcaPulse` rule injected
  via a `<style>` tag. In the TypeScript port, this should be defined in a global CSS
  file (`src/styles/global.css`) or injected once at the app root, not per component.

- **FR-018 semantic colors**: Event-type accent colors are defined in `EVENT_META` in the
  prototype. In the TypeScript port, `EVENT_META` should be typed as
  `Record<EventKind, { tag: string; name: string; color: string; glyph: string }>` and
  imported as a constant — not inlined per component — to ensure color consistency
  across the tiles, timeline rows, and mini-stats.

- **Accessibility**: Constitution Principle III mandates legibility, contrast, and touch
  targets for outdoor single-handed use. Minimum touch target: 44 × 44 px (Apple HIG /
  WCAG 2.5.5). Minimum text contrast: WCAG AA (4.5:1 for small text, 3:1 for large).
  The dark theme's `text: '#EAF1F8'` on `bg: '#0B0F14'` achieves ~14:1 contrast.

- **Alternatives considered**:
  - **Tailwind CSS**: Utility-class approach conflicts with the token-based theme system
    (dark/light switching via JS state) unless using Tailwind's `dark:` variant with a
    class toggle. The added build config is not justified when the prototype's inline-style
    system is already complete and typed.
  - **CSS Modules**: Suitable for scoped component styles but complicates the dynamic
    theming (runtime color values from the theme object). Inline styles are the simplest
    path for runtime-dynamic values.

---

## 9. Performance Budgets

- **Decision**: Adopt the following concrete, measurable performance budgets derived from
  SC-008 and Constitution Principle IV:

  | Metric | Budget | Verification method |
  |---|---|---|
  | Initial JS bundle (gzipped) | ≤ 150 KB | `vite build` + `rollup-plugin-visualizer` |
  | Time-to-Interactive (TTI) on mid-range Android (4× CPU throttle) | ≤ 2 000 ms | Lighthouse CI in GitHub Actions |
  | First Contentful Paint (FCP) | ≤ 1 500 ms | Lighthouse CI |
  | Timer tick display lag (1 s heartbeat drift) | ≤ 100 ms visible | Manual + Vitest fake-timer advance tests |
  | Interaction-to-paint latency (tap → tile update) | ≤ 100 ms | Chrome DevTools Performance panel |
  | localStorage write (autosave) | ≤ 5 ms | Vitest benchmark (performance.now() before/after) |
  | Offline launch (service worker cache hit) | ≤ 1 500 ms | Lighthouse offline audit |

- **Rationale**:
  - **SC-001**: "Running case clock visible in under 2 seconds from launch" → TTI ≤ 2 000 ms.
  - **SC-005**: "Dose interval reminder visible within 1 second of interval expiring" →
    the 1 s tick heartbeat is the ceiling; the tick must not drift visibly. The wall-clock
    derivation (section 5) ensures correctness; the heartbeat interval ensures display
    freshness.
  - **SC-008**: "No stutter or drift perceptible to the user throughout a 60-minute case"
    → tick drift ≤ 100 ms (well below human perception threshold of ~200 ms for UI lag).
  - **Bundle ≤ 150 KB gzipped**: React 18 + ReactDOM is ~45 KB gzipped; the remaining
    budget covers component code, theme tokens, and vite-plugin-pwa runtime. No large
    charting or date libraries are introduced. If Noto Sans TC is self-hosted, the WOFF2
    subset for the characters used (~3 000 Traditional Chinese glyphs) can be 200–400 KB —
    this is a font asset, not JS bundle, and is precached by the service worker. The JS
    bundle budget excludes font assets.

- **Timer drift specifics**:
  - The `setInterval(fn, 1000)` callback is not guaranteed to fire at exactly 1 000 ms;
    browser scheduling may defer it by 5–20 ms in the foreground. This is acceptable —
    the display updates once per second and the human eye cannot distinguish a 20 ms
    delay in a one-second tick.
  - The drift budget of ≤ 100 ms applies to the *displayed* value's accuracy, not the
    interval firing time. Because all values are derived from `Date.now()` at tick time,
    not accumulated ticks, the displayed value after `N` ticks is `Date.now() - caseStart`,
    which is always correct to within the OS scheduling jitter of one tick (~20 ms on
    modern devices in the foreground).

- **Monitoring in CI**:
  - Lighthouse CI (`@lhci/cli`) runs on the built `dist/` directory served by a local
    static server in GitHub Actions. Budget assertions are configured in `lighthouserc.js`.
  - Bundle size is asserted via `vite-bundle-visualizer` output or a custom script that
    checks the gzipped size of `dist/assets/*.js` after build.

- **Alternatives considered**:
  - **No explicit budgets**: Violates Principle IV ("each plan MUST declare explicit,
    measurable performance budgets"). Rejected.
  - **Stricter bundle target (≤ 100 KB)**: React + ReactDOM alone approach ~45 KB
    gzipped; leaving only ~55 KB for application code is feasible but tight. ≤ 150 KB
    is a more realistic target that avoids future pressure to avoid useful dependencies.

---

## Summary of Cross-Cutting Gotchas

The following gotchas span multiple sections and have the highest implementation risk:

1. **vite-plugin-pwa + non-root base path** (sections 2 & 3): `start_url`, `scope`, and
   all icon `src` paths in the web app manifest must use the full subpath prefix. This is
   the most common configuration error for GitHub Pages PWAs and causes silent install
   failures on iOS.

2. **iOS background timer throttling** (sections 5 & 2): The 1 s heartbeat will freeze
   during screen lock. Elapsed time correctness is maintained by `Date.now() - caseStart`
   derivation, but the CPR cycle 15-second warning (FR-002) can be missed if the screen
   is locked through the warning window. Document this as a known limitation; it cannot
   be fully solved without a Service Worker background sync or Wake Lock API (both add
   complexity and have their own iOS compatibility caveats).

3. **localStorage in private mode** (section 4): `setItem` throws synchronously in
   private mode on some iOS Safari versions. All persistence writes must be wrapped in
   `try/catch` and the app must degrade gracefully (warn user, continue without autosave).

4. **`autoUpdate` service worker for field safety** (section 2): Auto-update means a
   deploy to production is immediately live for all users on next app open with no
   prompt. This is the correct safety choice for a clinical tool, but it means bad
   deployments propagate automatically. CI quality gates (Principle IV) and Lighthouse
   CI must be enforced on every merge before the deploy step runs.
