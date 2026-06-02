import { useState } from 'react';
import type { Theme } from '../theme/tokens';
import type { OHCA } from '../domain/useOHCA';
import type { Vitals } from '../domain/types';
import { mapOf, fmtTimeOfDay } from '../domain/format';
import { SectionTitle } from './SectionTitle';
import { Sheet } from './Sheet';
import { NumPad } from './NumPad';

type VitalField = keyof Pick<Vitals, 'sys' | 'dia' | 'hr' | 'spo2' | 'etco2' | 'temp'>;

const VIT: Array<[VitalField, string, string, boolean?]> = [
  ['sys', '收縮壓 SBP', 'mmHg'],
  ['dia', '舒張壓 DBP', 'mmHg'],
  ['hr', '心跳 HR', '/分'],
  ['spo2', 'SpO₂', '%'],
  ['etco2', 'EtCO₂', 'mmHg'],
  ['temp', '體溫', '°C', true],
];

function VitalCell({
  t,
  label,
  value,
  unit,
  accent,
  draft,
  onClick,
}: {
  t: Theme;
  label: string;
  value?: string;
  unit?: string;
  accent: string;
  draft: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        font: 'inherit',
        borderRadius: 13,
        border: `1px solid ${draft ? accent : t.line}`,
        background: t.field,
        padding: '9px 11px',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        minHeight: 60,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: draft ? accent : t.textDim,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: value ? t.text : t.textFaint,
            fontFamily: 'var(--ohca-mono)',
            letterSpacing: -0.5,
          }}
        >
          {value || '––'}
        </span>
        {unit && <span style={{ fontSize: 11, fontWeight: 600, color: t.textDim }}>{unit}</span>}
      </span>
    </button>
  );
}

interface PadState {
  field: VitalField;
  label: string;
  suffix?: string;
  allowDot?: boolean;
  value: string;
}

// Vitals HUD: numeric-keypad entry, derived MAP, ECG note, timestamped commit
// (FR-009, FR-010).
export function VitalsHUD({ o, t }: { o: OHCA; t: Theme }) {
  const [draft, setDraft] = useState<Vitals>({});
  const [pad, setPad] = useState<PadState | null>(null);
  const map = mapOf(draft.sys, draft.dia);
  const hasDraft = Object.values(draft).some((v) => v != null && v !== '');

  const commit = () => {
    if (!hasDraft) return;
    o.actions.addVitals(draft);
    setDraft({});
  };

  return (
    <>
      <SectionTitle t={t} title="生命徵象" hint="點格子用數字鍵盤輸入" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
        {VIT.map(([f, lab, unit, dot]) => (
          <VitalCell
            key={f}
            t={t}
            label={lab}
            unit={unit}
            value={draft[f]}
            accent={t.accent}
            draft={draft[f] != null && draft[f] !== ''}
            onClick={() =>
              setPad({ field: f, label: lab, suffix: unit, allowDot: dot, value: draft[f] ?? '' })
            }
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 7, marginTop: 7 }}>
        <div
          aria-label="平均動脈壓 MAP"
          style={{
            flex: '0 0 auto',
            padding: '0 12px',
            height: 44,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 12,
            border: `1px solid ${t.line}`,
            background: t.field,
            color: t.textDim,
            fontSize: 12.5,
            fontWeight: 700,
          }}
        >
          MAP {map != null ? map : '––'}
        </div>
        <input
          placeholder="ECG / 4-lead 註記"
          value={draft.ecg ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, ecg: e.target.value }))}
          style={{
            flex: 1,
            height: 44,
            borderRadius: 12,
            border: `1px solid ${t.line}`,
            background: t.field,
            color: t.text,
            font: 'inherit',
            fontSize: 13,
            padding: '0 12px',
            outline: 'none',
          }}
        />
      </div>
      {hasDraft && (
        <button
          onClick={commit}
          style={{
            width: '100%',
            height: 50,
            marginTop: 8,
            borderRadius: 13,
            border: 'none',
            background: t.accent,
            color: '#fff',
            font: 'inherit',
            fontSize: 16,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: `0 6px 18px ${t.accent}66`,
          }}
        >
          登錄生命徵象 · {fmtTimeOfDay(o.now)}
        </button>
      )}

      <Sheet open={!!pad} onClose={() => setPad(null)} t={t} title={pad?.label}>
        {pad && (
          <NumPad
            value={pad.value}
            suffix={pad.suffix}
            allowDot={pad.allowDot}
            t={t}
            onChange={(v) => setPad((p) => (p ? { ...p, value: v } : p))}
            onDone={() => {
              setDraft((d) => ({ ...d, [pad.field]: pad.value }));
              setPad(null);
            }}
          />
        )}
      </Sheet>
    </>
  );
}
