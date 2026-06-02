import { describe, it, expect, beforeEach } from 'vitest';
import { createCaseStore } from '../../src/persistence/caseStore';
import type { CaseState } from '../../src/domain/types';

const sample: CaseState = {
  schemaVersion: 1,
  caseStart: 1000,
  cpr: { startAt: null },
  events: [{ id: 'e1', at: 1500, kind: 'epi', label: 'Epinephrine 第 1 劑' }],
};

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

describe('createCaseStore', () => {
  let storage: MemoryStorage;
  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('returns null when nothing is stored', () => {
    expect(createCaseStore(storage).load()).toBeNull();
  });

  it('round-trips a case (FR-020)', () => {
    const store = createCaseStore(storage);
    store.save(sample);
    expect(store.load()).toEqual({ ...sample, schemaVersion: 1 });
  });

  it('clears stored state', () => {
    const store = createCaseStore(storage);
    store.save(sample);
    store.clear();
    expect(store.load()).toBeNull();
  });

  it('returns null on corrupt JSON', () => {
    storage.setItem('ohca.case.v1', '{not json');
    expect(createCaseStore(storage).load()).toBeNull();
  });

  it('returns null on structurally invalid data', () => {
    storage.setItem('ohca.case.v1', JSON.stringify({ foo: 1 }));
    expect(createCaseStore(storage).load()).toBeNull();
  });

  it('degrades silently when storage is unavailable', () => {
    const store = createCaseStore(null);
    expect(() => store.save(sample)).not.toThrow();
    expect(store.load()).toBeNull();
  });

  it('does not throw when setItem fails (quota / private mode)', () => {
    const throwing = new MemoryStorage();
    throwing.setItem = () => {
      throw new Error('QuotaExceeded');
    };
    const store = createCaseStore(throwing);
    expect(() => store.save(sample)).not.toThrow();
  });
});
