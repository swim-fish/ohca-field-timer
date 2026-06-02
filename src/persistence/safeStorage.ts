// Shared localStorage accessor used by every on-device store (caseStore, prefStore).
// Probes availability once and returns null when storage is unusable (private mode,
// quota, SSR/jsdom without storage) so callers can degrade silently instead of throwing.
export function safeLocalStorage(): Storage | null {
  try {
    const ls = globalThis.localStorage;
    const probe = '__ohca_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}
