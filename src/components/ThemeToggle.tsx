import type { Theme } from '../theme/tokens';

interface ThemeToggleProps {
  mode: 'dark' | 'light';
  onToggle: () => void;
  t: Theme;
}

export function ThemeToggle({ mode, onToggle, t }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label="切換日夜模式"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 999,
        border: `1px solid ${t.line}`,
        background: t.surface2,
        color: t.textDim,
        cursor: 'pointer',
        font: 'inherit',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <span style={{ fontSize: 13 }}>{mode === 'dark' ? '🌙' : '☀️'}</span>
      {mode === 'dark' ? '夜間' : '白天'}
    </button>
  );
}
