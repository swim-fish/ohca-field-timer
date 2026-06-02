import type { Theme } from '../theme/tokens';
import { RHYTHMS } from '../domain/constants';

interface RhythmPickerProps {
  t: Theme;
  onPick: (label: string) => void;
}

// Rhythm analysis picker; shockable rhythms are badged (FR-007).
export function RhythmPicker({ t, onPick }: RhythmPickerProps) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {RHYTHMS.map((r) => (
        <button
          key={r.key}
          onClick={() => onPick(r.label)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 54,
            padding: '0 16px',
            borderRadius: 13,
            border: `1px solid ${t.line}`,
            background: t.field,
            color: t.text,
            font: 'inherit',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {r.label}
          {r.shockable && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#F0883E',
                background: '#F0883E22',
                padding: '3px 9px',
                borderRadius: 999,
              }}
            >
              可電擊
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
