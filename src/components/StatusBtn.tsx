import type { Theme } from '../theme/tokens';

interface StatusBtnProps {
  t: Theme;
  color: string;
  label: string;
  filled?: boolean;
  onClick: () => void;
}

export function StatusBtn({ t: _t, color, label, filled, onClick }: StatusBtnProps) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        height: 46,
        borderRadius: 13,
        cursor: 'pointer',
        font: 'inherit',
        fontSize: 13.5,
        fontWeight: 800,
        border: `1.5px solid ${color}`,
        padding: '0 6px',
        background: filled ? color : 'transparent',
        color: filled ? '#fff' : color,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {label}
    </button>
  );
}
