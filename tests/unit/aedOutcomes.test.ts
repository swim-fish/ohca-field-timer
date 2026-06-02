import { describe, it, expect } from 'vitest';
import { AED_OUTCOMES, RHYTHMS } from '../../src/domain/constants';

describe('AED_OUTCOMES (US4 simplified rhythm mode)', () => {
  it('defines exactly a shockable and a non-shockable coarse outcome', () => {
    expect(AED_OUTCOMES).toHaveLength(2);
    const shock = AED_OUTCOMES.find((o) => o.key === 'shock');
    const noshock = AED_OUTCOMES.find((o) => o.key === 'noshock');
    expect(shock?.shockable).toBe(true);
    expect(noshock?.shockable).toBe(false);
  });

  it('labels lead with the coarse token shown in the summary cell', () => {
    const shock = AED_OUTCOMES.find((o) => o.key === 'shock')!;
    const noshock = AED_OUTCOMES.find((o) => o.key === 'noshock')!;
    expect(shock.label.split(' ')[0]).toBe('可電擊');
    expect(noshock.label.split(' ')[0]).toBe('不可電擊');
  });

  it('clinical guardrail: a coarse outcome is never a specific ACLS rhythm', () => {
    const rhythmKeys = new Set(RHYTHMS.map((r) => r.key));
    const rhythmLabels = new Set(RHYTHMS.map((r) => r.label));
    for (const o of AED_OUTCOMES) {
      expect(rhythmKeys.has(o.key)).toBe(false);
      expect(rhythmLabels.has(o.label)).toBe(false);
      // must not embed a specific rhythm token (VF/pVT/PEA/Asystole)
      expect(o.label).not.toMatch(/VF|pVT|PEA|Asystole/);
    }
  });
});
