import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
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

function renderApp(storage = new MemoryStorage()) {
  const store = createCaseStore(storage);
  const utils = render(<App store={store} />);
  return { ...utils, storage, store };
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

describe('App — US1 elapsed clock & CPR', () => {
  it('shows a running elapsed clock from open (FR-001)', () => {
    renderApp();
    expect(screen.getByText('00:00')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(72_000);
    });
    expect(screen.getByText('01:12')).toBeInTheDocument();
  });

  it('starts a CPR cycle and warns near the end (FR-002)', () => {
    renderApp();
    fireEvent.click(screen.getByText('開始'));
    expect(screen.getByText(/第 1 輪/)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(110_000); // 10s remaining
    });
    expect(screen.getByText('⚠ 準備換手 · 心律檢查')).toBeInTheDocument();
  });
});

describe('App — US2 drugs & shocks', () => {
  it('logs Epinephrine, increments count and starts a countdown (FR-003)', () => {
    renderApp();
    fireEvent.click(screen.getByText('EPINEPHRINE 強心針'));
    expect(screen.getByText('已給 1 劑 · 點擊再給')).toBeInTheDocument();
    // mini-stat Epi shows 1 (scoped to the summary group)
    const stats = screen.getByRole('group', { name: '處置摘要' });
    expect(within(stats).getByText('Epi').parentElement).toHaveTextContent('1');
  });

  it('marks Epinephrine due after 3 minutes (FR-003)', () => {
    renderApp();
    fireEvent.click(screen.getByText('EPINEPHRINE 強心針'));
    act(() => {
      vi.advanceTimersByTime(181_000);
    });
    expect(screen.getByText('可給藥')).toBeInTheDocument();
  });

  it('records a defibrillation shock at a chosen energy (FR-005)', () => {
    renderApp();
    fireEvent.click(screen.getByText('DEFIB 電擊'));
    fireEvent.click(screen.getByText('200J'));
    const stats = screen.getByRole('group', { name: '處置摘要' });
    expect(within(stats).getByText('電擊').parentElement).toHaveTextContent('1');
  });
});

describe('App — US3 vitals & MAP', () => {
  it('computes MAP from entered BP (FR-009)', () => {
    renderApp();
    // open keypad for SBP
    fireEvent.click(screen.getByText('收縮壓 SBP'));
    ['1', '2', '0'].forEach((k) => fireEvent.click(screen.getByRole('button', { name: k })));
    fireEvent.click(screen.getByText('確定'));
    fireEvent.click(screen.getByText('舒張壓 DBP'));
    ['8', '0'].forEach((k) => fireEvent.click(screen.getByRole('button', { name: k })));
    fireEvent.click(screen.getByText('確定'));
    expect(screen.getByText('MAP 93')).toBeInTheDocument();
  });
});

describe('App — US4 timeline & delete', () => {
  it('shows empty state then logs to the timeline (FR-012)', () => {
    renderApp();
    expect(screen.getByText('尚未記錄任何處置')).toBeInTheDocument();
    fireEvent.click(screen.getByText('IO / IV 通路'));
    expect(screen.getByText('IO/IV 通路建立')).toBeInTheDocument();
  });

  it('swipe reveals delete and removing updates the summary (FR-013/016)', () => {
    renderApp();
    fireEvent.click(screen.getByText('EPINEPHRINE 強心針'));
    const row = screen.getByText('Epinephrine 第 1 劑').closest('[role="listitem"]') as HTMLElement;
    fireEvent.pointerDown(row, { clientX: 200, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(row, { clientX: 110, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(row, { clientX: 110, clientY: 100, pointerId: 1 });
    fireEvent.click(within(row).getByText('刪除'));
    expect(screen.queryByText('Epinephrine 第 1 劑')).not.toBeInTheDocument();
    expect(screen.getByText('Epi').parentElement).toHaveTextContent('0');
  });
});

describe('App — US5 milestones & new case', () => {
  it('declares ROSC and keeps the clock running (FR-014)', () => {
    renderApp();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    fireEvent.click(screen.getByText('ROSC'));
    expect(screen.getByText('ROSC · 恢復循環')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.getByText('01:05')).toBeInTheDocument(); // clock did not stop
  });

  it('new case clears events after confirm (FR-015)', () => {
    renderApp();
    fireEvent.click(screen.getByText('IO / IV 通路'));
    expect(screen.getByText('IO/IV 通路建立')).toBeInTheDocument();
    fireEvent.click(screen.getByText('新案件'));
    expect(screen.getByText('尚未記錄任何處置')).toBeInTheDocument();
  });

  it('deleting the ROSC timeline entry reverts the status (FR-016 — no desync)', () => {
    renderApp();
    fireEvent.click(screen.getByText('ROSC'));
    expect(screen.getByText('ROSC · 恢復循環')).toBeInTheDocument();
    const row = screen.getByText('恢復自發循環 (ROSC)').closest('[role="listitem"]') as HTMLElement;
    fireEvent.pointerDown(row, { clientX: 200, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(row, { clientX: 110, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(row, { clientX: 110, clientY: 100, pointerId: 1 });
    fireEvent.click(within(row).getByText('刪除'));
    // status reverts and ROSC can be declared again
    expect(screen.getByText('OHCA · CPR 進行中')).toBeInTheDocument();
    expect(screen.getByText('ROSC')).toBeInTheDocument();
  });
});

describe('App — US6 persistence', () => {
  it('restores an in-progress case from storage (FR-020)', () => {
    const storage = new MemoryStorage();
    const seeded: CaseState = {
      schemaVersion: 1,
      caseStart: T0 - 90_000,
      cpr: { startAt: null },
      events: [{ id: 'e1', at: T0 - 30_000, kind: 'epi', label: 'Epinephrine 第 1 劑' }],
    };
    storage.setItem('ohca.case.v1', JSON.stringify(seeded));
    renderApp(storage);
    expect(screen.getByText('01:30')).toBeInTheDocument();
    expect(screen.getByText('Epinephrine 第 1 劑')).toBeInTheDocument();
  });

  it('autosaves each action to storage (FR-020)', () => {
    const { storage } = renderApp();
    fireEvent.click(screen.getByText('IO / IV 通路'));
    const raw = storage.getItem('ohca.case.v1');
    expect(raw).toBeTruthy();
    expect(raw!).toContain('IO/IV');
  });
});

describe('App — FR-017 theme toggle', () => {
  it('toggles between dark and light labels', () => {
    renderApp();
    expect(screen.getByText('夜間')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('切換日夜模式'));
    expect(screen.getByText('白天')).toBeInTheDocument();
  });
});

describe('App — FR-007 rhythm shockable badge', () => {
  it('shows a shockable badge in the rhythm picker', () => {
    renderApp();
    fireEvent.click(screen.getByText('心律分析'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getAllByText('可電擊').length).toBeGreaterThan(0);
    fireEvent.click(within(dialog).getByText('VF 心室顫動'));
    const stats = screen.getByRole('group', { name: '處置摘要' });
    expect(within(stats).getByText('心律').parentElement).toHaveTextContent('VF');
  });
});

describe('App — FR-001 adjustable start time', () => {
  it('backfills the start time and recomputes elapsed (US1 scenario 5)', () => {
    renderApp();
    expect(screen.getByText('00:00')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('調整案件起始時間'));
    // enter 5 (minutes ago) on the keypad and confirm
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    fireEvent.click(screen.getByText('確定'));
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });
});

describe('App — FR-004 Amiodarone', () => {
  it('logs Amiodarone and signals due after 4 minutes', () => {
    renderApp();
    fireEvent.click(screen.getByText('AMIODARONE 抗心律'));
    const stats = screen.getByRole('group', { name: '處置摘要' });
    expect(within(stats).getByText('Amio').parentElement).toHaveTextContent('1');
    act(() => {
      vi.advanceTimersByTime(241_000);
    });
    expect(screen.getByText('AMIODARONE 抗心律').closest('button')).toHaveTextContent('可給藥');
  });
});

describe('App — reminder not a lock (state-contract invariant 2)', () => {
  it('allows a second Epinephrine dose before the interval elapses', () => {
    renderApp();
    fireEvent.click(screen.getByText('EPINEPHRINE 強心針'));
    act(() => {
      vi.advanceTimersByTime(30_000); // well before 3 min
    });
    fireEvent.click(screen.getByText('EPINEPHRINE 強心針'));
    const stats = screen.getByRole('group', { name: '處置摘要' });
    expect(within(stats).getByText('Epi').parentElement).toHaveTextContent('2');
  });
});

describe('App — FR-008 airway with ETT size', () => {
  it('records an endotracheal tube with its size', () => {
    renderApp();
    fireEvent.click(screen.getByText('氣道處置'));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByText('氣管內管 ETT'));
    fireEvent.click(within(dialog).getByText('7.5'));
    fireEvent.click(within(dialog).getByText('登錄氣道處置'));
    expect(screen.getByText('氣道：氣管內管 ETT 7.5')).toBeInTheDocument();
  });
});

describe('App — partial swipe does not delete (Edge Cases)', () => {
  it('snaps back without arming delete when swiped below threshold', () => {
    renderApp();
    fireEvent.click(screen.getByText('IO / IV 通路'));
    const row = screen.getByText('IO/IV 通路建立').closest('[role="listitem"]') as HTMLElement;
    fireEvent.pointerDown(row, { clientX: 200, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(row, { clientX: 188, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(row, { clientX: 188, clientY: 100, pointerId: 1 });
    expect(screen.queryByText('刪除')).not.toBeInTheDocument();
  });
});
