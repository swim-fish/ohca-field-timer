// Glove-friendly touch floor (feature 002, FR-006) — the single source of truth for
// minimum touch-target size and spacing, consumed by every interactive control.
// Mirrored in src/styles/global.css as the `--ohca-touch-min` / `--ohca-touch-gap`
// custom properties for any CSS-land consumer; keep the two in sync.
export const TOUCH_MIN = 56; // CSS px
export const TOUCH_GAP = 8; // CSS px
