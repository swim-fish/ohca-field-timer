import { describe, it, expect } from 'vitest';
import { pad2, fmtElapsed, fmtClock, fmtTimeOfDay, mapOf } from '../../src/domain/format';

describe('pad2', () => {
  it('pads single digits', () => {
    expect(pad2(0)).toBe('00');
    expect(pad2(7)).toBe('07');
    expect(pad2(42)).toBe('42');
  });
});

describe('fmtElapsed', () => {
  it('formats mm:ss under an hour', () => {
    expect(fmtElapsed(0)).toBe('00:00');
    expect(fmtElapsed(72)).toBe('01:12');
    expect(fmtElapsed(599)).toBe('09:59');
  });

  it('extends to h:mm:ss past 60 minutes (FR-001 / Edge Cases)', () => {
    expect(fmtElapsed(3600)).toBe('01:00:00');
    expect(fmtElapsed(3661)).toBe('01:01:01');
    expect(fmtElapsed(7322)).toBe('02:02:02');
  });

  it('clamps negatives to zero', () => {
    expect(fmtElapsed(-5)).toBe('00:00');
  });
});

describe('fmtClock', () => {
  it('formats positive countdown', () => {
    expect(fmtClock(125)).toBe('02:05');
  });
  it('prefixes overdue with +', () => {
    expect(fmtClock(-5)).toBe('+00:05');
  });
});

describe('fmtTimeOfDay', () => {
  it('formats HH:MM:SS', () => {
    const d = new Date(2026, 5, 2, 9, 7, 3);
    expect(fmtTimeOfDay(d)).toBe('09:07:03');
  });
});

describe('mapOf', () => {
  it('computes MAP from sys/dia', () => {
    expect(mapOf('120', '80')).toBe(93);
    expect(mapOf('90', '60')).toBe(70);
  });
  it('returns null when a value is missing (FR-009 edge case)', () => {
    expect(mapOf('120', '')).toBeNull();
    expect(mapOf(undefined, '80')).toBeNull();
  });
});
