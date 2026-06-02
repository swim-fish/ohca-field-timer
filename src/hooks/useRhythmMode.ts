// Reads and persists the remembered rhythm-analysis mode (feature 002, FR-015).
// Defaults to 進階 ACLS; the chosen mode survives reloads and is independent of the
// case record (so a new case keeps the operator's preference).
import { useCallback, useRef, useState } from 'react';
import type { RhythmMode } from '../domain/types';
import { createPrefStore, type PrefStore } from '../persistence/prefStore';

export function useRhythmMode(store?: PrefStore): [RhythmMode, (mode: RhythmMode) => void] {
  const storeRef = useRef<PrefStore>(store ?? createPrefStore());
  const [mode, setModeState] = useState<RhythmMode>(() => storeRef.current.getRhythmMode());

  const setMode = useCallback((next: RhythmMode) => {
    storeRef.current.setRhythmMode(next);
    setModeState(next);
  }, []);

  return [mode, setMode];
}
