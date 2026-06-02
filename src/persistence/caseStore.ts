// localStorage-backed persistence for the single active case (FR-020). Tolerant of
// unavailable storage / quota / private mode — never throws on save (degrade only).
import type { CaseState } from '../domain/types';
import { SCHEMA_VERSION } from '../domain/constants';
import { safeLocalStorage } from './safeStorage';

export interface CaseStore {
  load(): CaseState | null;
  save(state: CaseState): void;
  clear(): void;
}

const KEY = 'ohca.case.v1';

function isValid(value: unknown): value is CaseState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.caseStart === 'number' &&
    typeof v.cpr === 'object' &&
    v.cpr !== null &&
    Array.isArray(v.events)
  );
}

export function createCaseStore(storage: Storage | null = safeLocalStorage()): CaseStore {
  return {
    load(): CaseState | null {
      if (!storage) return null;
      try {
        const raw = storage.getItem(KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (!isValid(parsed)) return null;
        const version = typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 0;
        // Refuse to read a format newer than this build understands rather than
        // silently mis-deriving it. Older versions (< current) are read as-is until
        // a real migration step is added here.
        if (version > SCHEMA_VERSION) return null;
        return parsed;
      } catch {
        return null;
      }
    },
    save(state: CaseState): void {
      if (!storage) return;
      try {
        storage.setItem(KEY, JSON.stringify({ ...state, schemaVersion: SCHEMA_VERSION }));
      } catch {
        // Quota or private-mode failure: degrade silently, keep app usable.
      }
    },
    clear(): void {
      if (!storage) return;
      try {
        storage.removeItem(KEY);
      } catch {
        // ignore
      }
    },
  };
}
