import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
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

const T0 = new Date(2026, 5, 2, 20, 0, 0).getTime();

function renderApp() {
  return render(<App store={createCaseStore(new MemoryStorage())} />);
}

function rowOf(text: string): HTMLElement {
  const el = screen.getByText(text).closest('[role="listitem"]');
  if (!el) throw new Error(`no listitem row for "${text}"`);
  return el as HTMLElement;
}

// Drive a horizontal (reveal) swipe to the left by `dx` px on a row.
function swipe(row: HTMLElement, dx: number, dy = 0) {
  fireEvent.pointerDown(row, { clientX: 200, clientY: 100, pointerId: 1 });
  fireEvent.pointerMove(row, { clientX: 200 + dx, clientY: 100 + dy, pointerId: 1 });
  fireEvent.pointerUp(row, { clientX: 200 + dx, clientY: 100 + dy, pointerId: 1 });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  vi.stubGlobal('confirm', () => true);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Timeline swipe-to-delete (US1)', () => {
  it('SW-1/SW-3: swiping past threshold reveals delete; tapping it removes the entry and updates summaries', () => {
    renderApp();
    fireEvent.click(screen.getByText('EPINEPHRINE 強心針'));
    const row = rowOf('Epinephrine 第 1 劑');
    swipe(row, -90);
    fireEvent.click(within(row).getByText('刪除'));
    expect(screen.queryByText('Epinephrine 第 1 劑')).not.toBeInTheDocument();
    const stats = screen.getByRole('group', { name: '處置摘要' });
    expect(within(stats).getByText('Epi').parentElement).toHaveTextContent('0');
  });

  it('SW-2: a partial swipe below threshold snaps back and deletes nothing', () => {
    renderApp();
    fireEvent.click(screen.getByText('IO / IV 通路'));
    const row = rowOf('IO/IV 通路建立');
    swipe(row, -18); // below activation threshold
    expect(screen.queryByText('刪除')).not.toBeInTheDocument();
    expect(screen.getByText('IO/IV 通路建立')).toBeInTheDocument();
  });

  it('SW-5: a predominantly vertical drag does not arm delete (scroll, not swipe)', () => {
    renderApp();
    fireEvent.click(screen.getByText('IO / IV 通路'));
    const row = rowOf('IO/IV 通路建立');
    swipe(row, -10, -80); // mostly vertical
    expect(screen.queryByText('刪除')).not.toBeInTheDocument();
  });

  it('SW-7: long-press no longer arms delete', () => {
    renderApp();
    fireEvent.click(screen.getByText('IO / IV 通路'));
    const row = rowOf('IO/IV 通路建立');
    fireEvent.pointerDown(row, { clientX: 200, clientY: 100, pointerId: 1 });
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(screen.queryByText('刪除')).not.toBeInTheDocument();
    fireEvent.pointerUp(row, { clientX: 200, clientY: 100, pointerId: 1 });
  });

  it('SW-4: opening one row closes any other (at most one delete armed)', () => {
    renderApp();
    fireEvent.click(screen.getByText('IO / IV 通路'));
    fireEvent.click(screen.getByText('EPINEPHRINE 強心針'));
    swipe(rowOf('Epinephrine 第 1 劑'), -90);
    expect(screen.getAllByText('刪除')).toHaveLength(1);
    swipe(rowOf('IO/IV 通路建立'), -90);
    expect(screen.getAllByText('刪除')).toHaveLength(1);
  });

  it('Edge case: logging a new event closes any open delete control', () => {
    renderApp();
    fireEvent.click(screen.getByText('IO / IV 通路'));
    swipe(rowOf('IO/IV 通路建立'), -90);
    expect(screen.getByText('刪除')).toBeInTheDocument();
    // logging a new event must close the previously-armed delete control
    fireEvent.click(screen.getByText('EPINEPHRINE 強心針'));
    expect(screen.queryByText('刪除')).not.toBeInTheDocument();
  });
});
