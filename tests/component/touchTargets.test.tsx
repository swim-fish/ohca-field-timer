import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../src/App';
import { createCaseStore } from '../../src/persistence/caseStore';

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

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 5, 2, 20, 0, 0).getTime());
});
afterEach(() => {
  vi.useRealTimers();
});

// jsdom has no layout engine; assert the declared min size on the inline style.
function minDim(el: HTMLElement): number {
  const s = el.style;
  return parseFloat(s.minHeight || s.height || '0');
}

const TOUCH_MIN = 56;

describe('Glove-friendly touch floor (US2, FR-006)', () => {
  beforeEach(() => {
    render(<App store={createCaseStore(new MemoryStorage())} />);
  });

  it('TT-1: status buttons meet the 56px floor', () => {
    for (const name of ['ROSC', '到達醫院', '新案件']) {
      const btn = screen.getByRole('button', { name: new RegExp(name) });
      expect(minDim(btn)).toBeGreaterThanOrEqual(TOUCH_MIN);
    }
  });

  it('TT-1: action tiles meet the 56px floor', () => {
    const tile = screen.getByText('EPINEPHRINE 強心針').closest('button') as HTMLElement;
    expect(minDim(tile)).toBeGreaterThanOrEqual(TOUCH_MIN);
  });

  it('TT-1: the theme toggle meets the 56px floor', () => {
    const toggle = screen.getByLabelText('切換日夜模式');
    expect(minDim(toggle)).toBeGreaterThanOrEqual(TOUCH_MIN);
  });
});
