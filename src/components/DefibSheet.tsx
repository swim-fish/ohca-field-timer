import type { Theme } from '../theme/tokens';
import { DEFIB_JOULES } from '../domain/constants';
import { useTapGuard } from '../hooks/useTapGuard';

interface DefibSheetProps {
  t: Theme;
  onPick: (joules: number) => void;
}

// Defibrillation energy picker (FR-005). Buttons are bounce-guarded so a single gloved
// contact does not log two shocks (FR-008).
export function DefibSheet({ t, onPick }: DefibSheetProps) {
  const guard = useTapGuard();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {DEFIB_JOULES.map((j) => (
        <button
          key={j}
          onClick={guard(() => onPick(j))}
          style={{
            height: 60,
            borderRadius: 14,
            border: `1px solid ${t.line}`,
            background: t.field,
            color: t.text,
            font: 'inherit',
            fontSize: 20,
            fontWeight: 800,
            fontFamily: 'var(--ohca-mono)',
            cursor: 'pointer',
          }}
        >
          {j}J
        </button>
      ))}
      <button
        onClick={guard(() => onPick(200))}
        style={{
          height: 60,
          borderRadius: 14,
          border: 'none',
          background: '#F0883E',
          color: '#fff',
          font: 'inherit',
          fontSize: 15,
          fontWeight: 800,
          cursor: 'pointer',
        }}
      >
        記錄一次
      </button>
    </div>
  );
}
