import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, within } from '@testing-library/react';
import App from '../../src/App';
import { createCaseStore } from '../../src/persistence/caseStore';
import type { CaseState } from '../../src/domain/types';

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

const T0 = new Date(2026, 5, 2, 20, 0, 0).getTime();

// Controllable matchMedia so we can flip the wide/landscape state at will.
function installMatchMedia() {
  let matches = false;
  const listeners = new Set<(e: { matches: boolean }) => void>();
  const mql = {
    get matches() {
      return matches;
    },
    media: '',
    onchange: null,
    addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => listeners.delete(cb),
    addListener: (cb: (e: { matches: boolean }) => void) => listeners.add(cb),
    removeListener: (cb: (e: { matches: boolean }) => void) => listeners.delete(cb),
    dispatchEvent: () => false,
  };
  window.matchMedia = (() => mql) as unknown as typeof window.matchMedia;
  return {
    set(v: boolean) {
      matches = v;
      listeners.forEach((cb) => cb({ matches }));
    },
  };
}

function seededStore() {
  const storage = new MemoryStorage();
  const seeded: CaseState = {
    schemaVersion: 1,
    caseStart: T0 - 90_000,
    cpr: { startAt: null },
    events: [{ id: 'e1', at: T0 - 30_000, kind: 'epi', label: 'Epinephrine 第 1 劑' }],
  };
  storage.setItem('ohca.case.v1', JSON.stringify(seeded));
  return createCaseStore(storage);
}

let mm: ReturnType<typeof installMatchMedia>;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  mm = installMatchMedia();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('Adaptive layout (US3)', () => {
  it('RL-2: portrait/narrow renders the single-column layout', () => {
    render(<App store={createCaseStore(new MemoryStorage())} />);
    expect(screen.getByTestId('app-root')).toHaveAttribute('data-layout', 'narrow');
  });

  it('RL-1: wide/landscape renders the multi-zone layout', () => {
    mm.set(true);
    render(<App store={createCaseStore(new MemoryStorage())} />);
    expect(screen.getByTestId('app-root')).toHaveAttribute('data-layout', 'wide');
    // timeline lives in the persistent side zone
    expect(within(screen.getByTestId('timeline-zone')).getByText('處置時間軸')).toBeInTheDocument();
  });

  it('RL-4: switching to wide mid-case preserves case state with no data loss', () => {
    render(<App store={seededStore()} />);
    const stats = screen.getByRole('group', { name: '處置摘要' });
    expect(within(stats).getByText('Epi').parentElement).toHaveTextContent('1');
    expect(screen.getByText('01:30')).toBeInTheDocument();

    act(() => {
      mm.set(true);
    });

    expect(screen.getByTestId('app-root')).toHaveAttribute('data-layout', 'wide');
    const stats2 = screen.getByRole('group', { name: '處置摘要' });
    expect(within(stats2).getByText('Epi').parentElement).toHaveTextContent('1');
    expect(screen.getByText('Epinephrine 第 1 劑')).toBeInTheDocument();
    expect(screen.getByText('01:30')).toBeInTheDocument();
  });
});
