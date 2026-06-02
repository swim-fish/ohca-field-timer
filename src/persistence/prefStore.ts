// Standalone localStorage-backed UI preferences (feature 002). Deliberately kept
// separate from the versioned case state (caseStore.ts) so starting a new case /
// clearing a case never resets the operator's remembered choices (FR-015).
// Tolerant of unavailable storage / quota / private mode — never throws.
import type { RhythmMode } from '../domain/types';
import { RHYTHM_MODES } from '../domain/constants';
import { safeLocalStorage } from './safeStorage';

export interface PrefStore {
  getRhythmMode(): RhythmMode;
  setRhythmMode(mode: RhythmMode): void;
}

const RHYTHM_MODE_KEY = 'ohca.rhythmMode';
const DEFAULT_RHYTHM_MODE: RhythmMode = '進階 ACLS';

export function createPrefStore(storage: Storage | null = safeLocalStorage()): PrefStore {
  return {
    getRhythmMode(): RhythmMode {
      if (!storage) return DEFAULT_RHYTHM_MODE;
      try {
        const raw = storage.getItem(RHYTHM_MODE_KEY);
        // Unknown / corrupt values fall back to the default rather than throwing.
        return RHYTHM_MODES.includes(raw as RhythmMode) ? (raw as RhythmMode) : DEFAULT_RHYTHM_MODE;
      } catch {
        return DEFAULT_RHYTHM_MODE;
      }
    },
    setRhythmMode(mode: RhythmMode): void {
      if (!storage) return;
      try {
        storage.setItem(RHYTHM_MODE_KEY, mode);
      } catch {
        // Quota or private-mode failure: degrade silently, keep app usable.
      }
    },
  };
}
