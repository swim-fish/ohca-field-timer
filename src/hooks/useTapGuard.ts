// Bounce guard for gloved taps (feature 002, FR-008). A single gloved contact can
// emit two near-instant click events; this drops a duplicate fired within a short
// window while still allowing genuine, deliberately-spaced repeated taps to register.
import { useCallback, useRef } from 'react';

const DEFAULT_WINDOW_MS = 70;

export function useTapGuard(windowMs: number = DEFAULT_WINDOW_MS, now: () => number = Date.now) {
  const lastRef = useRef(0);
  return useCallback(
    <A extends unknown[]>(fn: (...args: A) => void) =>
      (...args: A) => {
        const t = now();
        if (t - lastRef.current < windowMs) return;
        lastRef.current = t;
        fn(...args);
      },
    [windowMs, now],
  );
}
