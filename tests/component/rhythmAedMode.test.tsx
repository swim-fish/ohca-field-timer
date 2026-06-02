import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import App from '../../src/App';
import { createCaseStore } from '../../src/persistence/caseStore';
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

const T0 = new Date(2026, 5, 2, 20, 0, 0).getTime();

function renderApp(prefStorage = new MemoryStorage()) {
  const utils = render(
    <App store={createCaseStore(new MemoryStorage())} prefStore={createPrefStore(prefStorage)} />,
  );
  return { ...utils, prefStorage };
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

function openRhythm() {
  fireEvent.click(screen.getByText('心律分析'));
  return screen.getByRole('dialog');
}

describe('Simplified AED rhythm mode (US4)', () => {
  it('AED-1/AED-2: opens in 進階 ACLS with the 5-rhythm picker and a mode toggle', () => {
    renderApp();
    const dialog = openRhythm();
    expect(within(dialog).getByText('進階 ACLS')).toBeInTheDocument();
    expect(within(dialog).getByText('簡易 AED')).toBeInTheDocument();
    expect(within(dialog).getByText('VF 心室顫動')).toBeInTheDocument();
  });

  it('AED-3: switching to 簡易 AED shows the two coarse choices', () => {
    renderApp();
    const dialog = openRhythm();
    fireEvent.click(within(dialog).getByText('簡易 AED'));
    expect(within(dialog).getByText('建議電擊')).toBeInTheDocument();
    expect(within(dialog).getByText('不建議電擊')).toBeInTheDocument();
    expect(within(dialog).queryByText('VF 心室顫動')).not.toBeInTheDocument();
  });

  it('AED-4/AED-5: 建議電擊 records 可電擊 and the 已電擊 shortcut logs a shock', () => {
    renderApp();
    const dialog = openRhythm();
    fireEvent.click(within(dialog).getByText('簡易 AED'));
    fireEvent.click(within(dialog).getByText('建議電擊'));
    fireEvent.click(screen.getByText('已電擊'));
    const stats = screen.getByRole('group', { name: '處置摘要' });
    expect(within(stats).getByText('心律').parentElement).toHaveTextContent('可電擊');
    expect(within(stats).getByText('電擊').parentElement).toHaveTextContent('1');
  });

  it('AED-6: declining the 已電擊 shortcut keeps the rhythm but logs no shock', () => {
    renderApp();
    const dialog = openRhythm();
    fireEvent.click(within(dialog).getByText('簡易 AED'));
    fireEvent.click(within(dialog).getByText('建議電擊'));
    fireEvent.click(screen.getByText('略過'));
    const stats = screen.getByRole('group', { name: '處置摘要' });
    expect(within(stats).getByText('心律').parentElement).toHaveTextContent('可電擊');
    expect(within(stats).getByText('電擊').parentElement).toHaveTextContent('0');
  });

  it('FR-008: a gloved double-contact on 已電擊 logs only one shock', () => {
    renderApp();
    const dialog = openRhythm();
    fireEvent.click(within(dialog).getByText('簡易 AED'));
    fireEvent.click(within(dialog).getByText('建議電擊'));
    // two synchronous clicks within the bounce window (frozen fake clock)
    const btn = screen.getByText('已電擊');
    act(() => {
      btn.click();
      btn.click();
    });
    const stats = screen.getByRole('group', { name: '處置摘要' });
    expect(within(stats).getByText('電擊').parentElement).toHaveTextContent('1');
  });

  it('AED-7: remembers the last-used mode across a remount', () => {
    const { prefStorage, unmount } = renderApp();
    fireEvent.click(screen.getByText('心律分析'));
    fireEvent.click(within(screen.getByRole('dialog')).getByText('簡易 AED'));
    unmount();

    renderApp(prefStorage);
    const dialog = openRhythm();
    // opens directly in 簡易 AED — coarse buttons visible without toggling
    expect(within(dialog).getByText('建議電擊')).toBeInTheDocument();
  });
});
