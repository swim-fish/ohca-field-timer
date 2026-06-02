import type { Theme } from '../theme/tokens';
import type { OHCA } from '../domain/useOHCA';

function MiniStat({
  t,
  label,
  value,
  color,
  small,
}: {
  t: Theme;
  label: string;
  value: string | number;
  color: string;
  small?: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: 13,
        border: `1px solid ${t.line}`,
        background: t.surface,
        padding: '10px 6px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 10.5, fontWeight: 700, color: t.textDim, marginBottom: 4 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: small ? 14 : 26,
          fontWeight: 800,
          color,
          fontFamily: 'var(--ohca-mono)',
          letterSpacing: -0.5,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// Treatment summary — counts derived from the events array (FR-011, FR-016).
export function StatsStrip({ o, t }: { o: OHCA; t: Theme }) {
  return (
    <div
      role="group"
      aria-label="處置摘要"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}
    >
      <MiniStat t={t} label="電擊" value={o.shocks} color="#F0883E" />
      <MiniStat t={t} label="Epi" value={o.epi.count} color="#E5484D" />
      <MiniStat t={t} label="Amio" value={o.amio.count} color="#0E9C9C" />
      <MiniStat
        t={t}
        label="心律"
        value={o.initialRhythm ? o.initialRhythm.split(' ')[0]! : '未知'}
        color="#6E56CF"
        small
      />
    </div>
  );
}
