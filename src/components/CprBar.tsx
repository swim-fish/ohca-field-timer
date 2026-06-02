import type { Theme } from '../theme/tokens';
import type { OHCA } from '../domain/useOHCA';
import { fmtClock } from '../domain/format';

// CPR 2-minute cycle cue: countdown, cycle number, progress bar, and a switch /
// rhythm-check warning within the final 15 seconds (FR-002).
export function CprBar({ o, t }: { o: OHCA; t: Theme }) {
  const danger = o.cprActive && o.cprRemain != null && o.cprRemain <= 15;
  const pct = o.cprActive && o.cprRemain != null ? (o.cprRemain / o.CPR_CYCLE) * 100 : 0;
  return (
    <div
      style={{
        marginTop: 11,
        borderRadius: 13,
        border: `1px solid ${danger ? '#F0883E' : t.line}`,
        background: t.surface,
        padding: '9px 12px',
        boxShadow: danger ? '0 0 18px #F0883E55' : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 7,
        }}
      >
        <span style={{ fontSize: 11.5, fontWeight: 800, color: t.textDim, letterSpacing: 0.3 }}>
          CPR 2 分鐘循環 {o.cprActive ? `· 第 ${o.cprCycleNum} 輪` : ''}
        </span>
        {o.cprActive && o.cprRemain != null ? (
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              fontFamily: 'var(--ohca-mono)',
              color: danger ? '#F0883E' : t.text,
            }}
          >
            {fmtClock(o.cprRemain)}
          </span>
        ) : (
          <button
            onClick={o.actions.startCpr}
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#fff',
              background: t.accent,
              border: 'none',
              borderRadius: 8,
              padding: '4px 12px',
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            開始
          </button>
        )}
      </div>
      <div style={{ height: 6, borderRadius: 6, background: t.surface2, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: pct + '%',
            borderRadius: 6,
            background: danger ? '#F0883E' : t.accent,
            transition: 'width .9s linear',
          }}
        />
      </div>
      {danger && (
        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#F0883E', marginTop: 6 }}>
          ⚠ 準備換手 · 心律檢查
        </div>
      )}
    </div>
  );
}
