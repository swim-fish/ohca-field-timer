import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTapGuard } from '../../src/hooks/useTapGuard';

describe('useTapGuard (US2, FR-008)', () => {
  it('drops a duplicate fired within the bounce window but allows spaced taps', () => {
    let clock = 1000;
    const now = () => clock;
    const { result } = renderHook(() => useTapGuard(70, now));
    const fn = vi.fn();
    const guarded = result.current(fn);

    guarded(); // fires
    guarded(); // same instant → bounce, dropped
    expect(fn).toHaveBeenCalledTimes(1);

    clock += 100; // a deliberate, spaced tap
    guarded();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
