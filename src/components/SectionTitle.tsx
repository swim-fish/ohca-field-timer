import type { Theme } from '../theme/tokens';

export function SectionTitle({
  t,
  title,
  hint,
}: {
  t: Theme;
  title: string;
  hint?: string | null;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        margin: '18px 0 9px',
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 800, color: t.text, letterSpacing: 0.3 }}>
        {title}
      </span>
      {hint && <span style={{ fontSize: 11, color: t.textFaint }}>{hint}</span>}
    </div>
  );
}
