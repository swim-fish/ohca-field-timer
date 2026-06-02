import { useState, useCallback } from 'react';
import { THEMES, type Theme } from './tokens';

export interface ThemeApi {
  mode: 'dark' | 'light';
  t: Theme;
  toggle: () => void;
}

export function useTheme(initial: 'dark' | 'light' = 'dark'): ThemeApi {
  const [mode, setMode] = useState<'dark' | 'light'>(initial);
  const toggle = useCallback(() => setMode((m) => (m === 'dark' ? 'light' : 'dark')), []);
  return { mode, t: THEMES[mode], toggle };
}
