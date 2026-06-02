import type { Theme } from '../theme/tokens';
import { useTapGuard } from '../hooks/useTapGuard';

interface TacTileProps {
  t: Theme;
  accent: string;
  kicker: string;
  big: string;
  sub: string;
  onClick: () => void;
  due?: boolean;
  active?: boolean;
}

// Drug / action tile with semantic accent, big glanceable value and due-pulse cue.
// Taps are bounce-guarded so a single gloved contact is not double-counted (FR-008).
export function TacTile({ t, accent, kicker, big, sub, onClick, due, active }: TacTileProps) {
  const guard = useTapGuard();
  return (
    <button
      onClick={guard(onClick)}
      style={{
        position: 'relative',
        textAlign: 'left',
        cursor: 'pointer',
        font: 'inherit',
        border: `1px solid ${due ? accent : t.line}`,
        borderRadius: 16,
        padding: '12px 13px',
        background: active ? `linear-gradient(160deg, ${accent}26, ${t.surface})` : t.surface,
        boxShadow: due ? `0 0 0 2px ${accent}, 0 0 22px ${accent}66` : 'none',
        overflow: 'hidden',
        minHeight: 104,
        display: 'flex',
        flexDirection: 'column',
        animation: due ? 'ohcaPulse 1s ease-in-out infinite' : 'none',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 9,
          height: 9,
          borderRadius: 9,
          background: accent,
          boxShadow: `0 0 10px ${accent}`,
        }}
      />
      <span style={{ fontSize: 12.5, fontWeight: 800, color: accent, letterSpacing: 0.2 }}>
        {kicker}
      </span>
      <span
        style={{
          marginTop: 'auto',
          fontSize: big.length > 5 ? 26 : 34,
          fontWeight: 800,
          color: t.text,
          fontFamily: 'var(--ohca-mono)',
          letterSpacing: -1,
          lineHeight: 1,
        }}
      >
        {big}
      </span>
      <span style={{ fontSize: 11.5, color: t.textDim, marginTop: 5, fontWeight: 600 }}>{sub}</span>
    </button>
  );
}
