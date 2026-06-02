import { describe, it, expect } from 'vitest';
import { derive, countdowns, elapsedSec } from '../../src/domain/derive';
import type { CaseState, OhcaEvent } from '../../src/domain/types';

const ev = (kind: OhcaEvent['kind'], at: number, extra: Partial<OhcaEvent> = {}): OhcaEvent => ({
  id: `${kind}${at}`,
  at,
  kind,
  label: kind,
  ...extra,
});

describe('derive', () => {
  it('counts drugs and shocks', () => {
    const d = derive([ev('epi', 1), ev('epi', 2), ev('amio', 3), ev('defib', 4)]);
    expect(d.epi.count).toBe(2);
    expect(d.epi.lastAt).toBe(2);
    expect(d.amio.count).toBe(1);
    expect(d.shocks).toBe(1);
  });

  it('reports ivDone', () => {
    expect(derive([]).ivDone).toBe(false);
    expect(derive([ev('iv', 1)]).ivDone).toBe(true);
  });

  it('takes initial rhythm from the earliest rhythm event and last from the latest', () => {
    const d = derive([
      ev('rhythm', 30, { rhythm: 'VF 心室顫動' }),
      ev('rhythm', 200, { rhythm: 'pVT 無脈性室速' }),
    ]);
    expect(d.initialRhythm).toBe('VF 心室顫動');
    expect(d.lastRhythm).toBe('pVT 無脈性室速');
  });

  it('takes the latest airway with size, defaults to 無', () => {
    expect(derive([]).airway).toEqual({ type: '無', size: null });
    const d = derive([
      ev('airway', 10, { airwayType: '聲門上 i-gel', airwaySize: null }),
      ev('airway', 20, { airwayType: '氣管內管 ETT', airwaySize: '7.5' }),
    ]);
    expect(d.airway).toEqual({ type: '氣管內管 ETT', size: '7.5' });
  });

  it('takes the latest vitals', () => {
    const d = derive([
      ev('vitals', 10, { vitals: { hr: '80' } }),
      ev('vitals', 20, { vitals: { hr: '120' } }),
    ]);
    expect(d.lastVitals).toEqual({ hr: '120' });
  });

  it('derives rosc/arrived from events (single source of truth, FR-016)', () => {
    expect(derive([]).rosc).toBeNull();
    const withRosc = derive([ev('rosc', 500), ev('arrival', 900)]);
    expect(withRosc.rosc).toBe(500);
    expect(withRosc.arrived).toBe(900);
  });

  it('reverts rosc to null when the rosc event is removed (no desync)', () => {
    const events = [ev('rosc', 500)];
    expect(derive(events).rosc).toBe(500);
    expect(derive(events.filter((e) => e.kind !== 'rosc')).rosc).toBeNull();
  });

  it('recomputes initialRhythm after the earliest rhythm is deleted (Edge Cases)', () => {
    const events = [
      ev('rhythm', 30, { rhythm: 'VF 心室顫動' }),
      ev('rhythm', 200, { rhythm: 'pVT 無脈性室速' }),
    ];
    const afterDelete = events.filter((e) => e.at !== 30);
    expect(derive(afterDelete).initialRhythm).toBe('pVT 無脈性室速');
    expect(derive([]).initialRhythm).toBeNull();
  });
});

describe('countdowns', () => {
  const base: CaseState = {
    schemaVersion: 1,
    caseStart: 0,
    cpr: { startAt: null },
    events: [],
  };

  it('returns null countdowns before any dose / cpr', () => {
    const c = countdowns(base, derive(base.events), 10_000);
    expect(c.epiRemain).toBeNull();
    expect(c.amioRemain).toBeNull();
    expect(c.cprRemain).toBeNull();
    expect(c.cprActive).toBe(false);
    expect(c.cprCycleNum).toBe(0);
  });

  it('counts epi down from 180s and goes negative when overdue', () => {
    const events = [ev('epi', 1000)];
    const c1 = countdowns({ ...base, events }, derive(events), 1000);
    expect(c1.epiRemain).toBeCloseTo(180);
    const c2 = countdowns({ ...base, events }, derive(events), 1000 + 200_000);
    expect(c2.epiRemain!).toBeLessThan(0); // overdue → due
  });

  it('computes CPR cycle number and remaining (FR-002)', () => {
    const state = { ...base, cpr: { startAt: 0 } };
    const d = derive(state.events);
    // 150s in: cycle 2, remaining = 120 - (150 % 120) = 90
    const c = countdowns(state, d, 150_000);
    expect(c.cprCycleNum).toBe(2);
    expect(c.cprRemain).toBeCloseTo(90);
    expect(c.cprActive).toBe(true);
  });
});

describe('elapsedSec', () => {
  it('floors elapsed seconds from caseStart', () => {
    expect(elapsedSec(0, 7200)).toBe(7);
    expect(elapsedSec(1000, 1000)).toBe(0);
  });
});
