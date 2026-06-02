import type { Theme } from '../theme/tokens';

interface NumPadProps {
  value: string;
  onChange: (v: string) => void;
  onDone: () => void;
  t: Theme;
  allowDot?: boolean;
  suffix?: string;
}

// Large numeric keypad for fast gloved-hand entry (FR-009). value is a string.
export function NumPad({ value, onChange, onDone, t, allowDot, suffix }: NumPadProps) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', allowDot ? '.' : '', '0', '⌫'];
  const press = (k: string) => {
    if (k === '') return;
    if (k === '⌫') return onChange(value.slice(0, -1));
    if (k === '.' && value.includes('.')) return;
    if (value.length >= 4) return;
    onChange(value + k);
  };
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: 8,
          height: 60,
          marginBottom: 10,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span
          style={{
            fontSize: 46,
            fontWeight: 800,
            color: t.text,
            letterSpacing: -1,
            fontFamily: 'var(--ohca-mono)',
          }}
        >
          {value || '0'}
        </span>
        {suffix && (
          <span style={{ fontSize: 16, fontWeight: 700, color: t.textDim }}>{suffix}</span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {keys.map((k, i) => (
          <button
            key={i}
            onClick={() => press(k)}
            disabled={k === ''}
            aria-label={k === '⌫' ? '刪除' : k || undefined}
            style={{
              height: 56,
              borderRadius: 14,
              border: `1px solid ${t.line}`,
              background: k === '⌫' ? t.surface2 : t.field,
              color: t.text,
              cursor: k ? 'pointer' : 'default',
              font: 'inherit',
              fontSize: 24,
              fontWeight: 700,
              fontFamily: 'var(--ohca-mono)',
              opacity: k === '' ? 0 : 1,
            }}
          >
            {k}
          </button>
        ))}
      </div>
      <button
        onClick={onDone}
        style={{
          width: '100%',
          height: 52,
          marginTop: 10,
          borderRadius: 14,
          border: 'none',
          background: t.accent,
          color: '#fff',
          font: 'inherit',
          fontSize: 17,
          fontWeight: 800,
          cursor: 'pointer',
        }}
      >
        確定
      </button>
    </div>
  );
}
