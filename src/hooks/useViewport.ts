// Viewport flag for the adaptive layout (feature 002, FR-009). Drives layout from
// the viewport (not device sniffing): `wide` is true on landscape tablets/phones and
// wide touchscreens, false in phone portrait. matchMedia is dependency-free and
// mockable in tests.
import { useEffect, useState } from 'react';

// Landscape on a reasonably wide screen, OR any sufficiently wide viewport.
const WIDE_QUERY = '(min-width: 900px) and (orientation: landscape), (min-width: 1000px)';

function read(): boolean {
  return (
    typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(WIDE_QUERY).matches
  );
}

export function useViewport(): boolean {
  const [wide, setWide] = useState<boolean>(read);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(WIDE_QUERY);
    const onChange = () => setWide(mql.matches);
    // The useState lazy initializer already seeded the current value; only subscribe to
    // subsequent changes (avoids a redundant set-state + re-render on mount).
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, []);

  return wide;
}
