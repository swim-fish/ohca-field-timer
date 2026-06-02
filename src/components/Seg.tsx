import type { Theme } from '../theme/tokens';

interface SegProps {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  t: Theme;
  size?: 'sm' | 'md';
}

// Segmented control (e.g. ETT tube size).
export function Seg({ options, value, onChange, t, size }: SegProps) {
  const h = size === 'sm' ? 32 : 40;
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        padding: 4,
        borderRadius: 12,
        background: t.surface2,
        border: `1px solid ${t.line}`,
      }}
    >
      {options.map((v) => {
        const on = v === value;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            style={{
              flex: 1,
              height: h,
              borderRadius: 9,
              border: 'none',
              cursor: 'pointer',
              font: 'inherit',
              fontWeight: 700,
              fontSize: 13,
              whiteSpace: 'nowrap',
              padding: '0 10px',
              background: on ? t.accent : 'transparent',
              color: on ? '#fff' : t.textDim,
              transition: 'background .15s, color .15s',
            }}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}
