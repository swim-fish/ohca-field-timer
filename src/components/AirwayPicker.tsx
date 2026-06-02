import { useState } from 'react';
import type { Theme } from '../theme/tokens';
import { AIRWAYS, ETT_SIZES } from '../domain/constants';
import { Seg } from './Seg';

interface AirwayPickerProps {
  t: Theme;
  current: { type: string; size: string | null };
  onConfirm: (type: string, size: string | null) => void;
}

// Airway device picker with ETT tube-size selection (FR-008).
export function AirwayPicker({ t, current, onConfirm }: AirwayPickerProps) {
  const [type, setType] = useState(current.type);
  const [size, setSize] = useState(current.size ?? '7.5');
  const isETT = type === '氣管內管 ETT';
  return (
    <div>
      <div style={{ display: 'grid', gap: 7, marginBottom: 12 }}>
        {AIRWAYS.map((a) => (
          <button
            key={a}
            onClick={() => setType(a)}
            style={{
              height: 50,
              borderRadius: 12,
              border: `1.5px solid ${type === a ? t.accent : t.line}`,
              background: type === a ? t.accent + '1A' : t.field,
              color: t.text,
              font: 'inherit',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {a}
          </button>
        ))}
      </div>
      {isETT && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.textDim, marginBottom: 6 }}>
            管徑 / 深度
          </div>
          <Seg t={t} options={ETT_SIZES} value={size} onChange={setSize} />
        </div>
      )}
      <button
        onClick={() => onConfirm(type, isETT ? size : null)}
        style={{
          width: '100%',
          height: 52,
          borderRadius: 13,
          border: 'none',
          background: t.accent,
          color: '#fff',
          font: 'inherit',
          fontSize: 16,
          fontWeight: 800,
          cursor: 'pointer',
        }}
      >
        登錄氣道處置
      </button>
    </div>
  );
}
