import { useState } from 'react';
import type { Theme } from '../theme/tokens';
import type { OHCA } from '../domain/useOHCA';
import { fmtElapsed, fmtTimeOfDay } from '../domain/format';
import { ThemeToggle } from './ThemeToggle';
import { Sheet } from './Sheet';
import { NumPad } from './NumPad';

interface CommandBarProps {
  o: OHCA;
  t: Theme;
  mode: 'dark' | 'light';
  onToggleTheme: () => void;
}

// Sticky command bar: status, master elapsed clock (auto-started, adjustable),
// time of day, and the theme toggle (FR-001, FR-014, FR-017).
export function CommandBar({ o, t, mode, onToggleTheme }: CommandBarProps) {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [mins, setMins] = useState('');

  const applyAdjust = () => {
    const m = parseInt(mins, 10);
    if (isFinite(m)) o.actions.adjustStart(o.nowMs - m * 60_000);
    setMins('');
    setAdjustOpen(false);
  };

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: t.surface2 + 'F2',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${t.line}`,
        padding: '14px 15px 12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span
              aria-label={o.rosc ? 'ROSC 恢復循環' : 'OHCA CPR 進行中'}
              style={{
                width: 8,
                height: 8,
                borderRadius: 8,
                background: o.rosc ? '#1FA463' : '#E5484D',
                boxShadow: `0 0 9px ${o.rosc ? '#1FA463' : '#E5484D'}`,
                animation: 'ohcaPulse 1.4s infinite',
              }}
            />
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.5, color: t.textDim }}>
              {o.rosc ? 'ROSC · 恢復循環' : 'OHCA · CPR 進行中'}
            </span>
          </div>
          <button
            onClick={() => setAdjustOpen(true)}
            aria-label="調整案件起始時間"
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 9,
              marginTop: 3,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: t.text,
              font: 'inherit',
            }}
          >
            <span
              style={{
                fontSize: 42,
                fontWeight: 800,
                fontFamily: 'var(--ohca-mono)',
                letterSpacing: -2,
                lineHeight: 1,
              }}
            >
              {fmtElapsed(o.elapsedSec)}
            </span>
            <span style={{ fontSize: 11, color: t.textDim, fontWeight: 600 }}>經過</span>
          </button>
          <div
            style={{
              fontSize: 11.5,
              color: t.textFaint,
              marginTop: 3,
              fontFamily: 'var(--ohca-mono)',
            }}
          >
            現在 {fmtTimeOfDay(o.now)}
          </div>
        </div>
        <ThemeToggle mode={mode} onToggle={onToggleTheme} t={t} />
      </div>

      <Sheet open={adjustOpen} onClose={() => setAdjustOpen(false)} t={t} title="調整案件起始時間">
        <div style={{ fontSize: 12.5, color: t.textDim, marginBottom: 10 }}>
          輸入案件「已經進行幾分鐘」以回溯實際起始時間。
        </div>
        <NumPad value={mins} suffix="分鐘前" t={t} onChange={setMins} onDone={applyAdjust} />
      </Sheet>
    </div>
  );
}
