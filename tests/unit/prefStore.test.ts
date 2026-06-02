import { describe, it, expect } from 'vitest';
import { createPrefStore } from '../../src/persistence/prefStore';

class MemoryStorage implements Storage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
}

describe('prefStore — rhythm-analysis mode (US4, FR-015)', () => {
  it('PR-1: defaults to 進階 ACLS when nothing is stored', () => {
    const store = createPrefStore(new MemoryStorage());
    expect(store.getRhythmMode()).toBe('進階 ACLS');
  });

  it('PR-2/PR-3: writes and restores the chosen mode', () => {
    const storage = new MemoryStorage();
    createPrefStore(storage).setRhythmMode('簡易 AED');
    expect(storage.getItem('ohca.rhythmMode')).toBe('簡易 AED');
    // a fresh store over the same storage restores it
    expect(createPrefStore(storage).getRhythmMode()).toBe('簡易 AED');
  });

  it('PR-5: falls back to the default on a corrupt/unknown value', () => {
    const storage = new MemoryStorage();
    storage.setItem('ohca.rhythmMode', 'garbage');
    expect(createPrefStore(storage).getRhythmMode()).toBe('進階 ACLS');
  });

  it('degrades safely when storage is unavailable', () => {
    const store = createPrefStore(null);
    expect(store.getRhythmMode()).toBe('進階 ACLS');
    expect(() => store.setRhythmMode('簡易 AED')).not.toThrow();
  });
});
