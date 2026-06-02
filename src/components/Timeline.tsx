import type { Theme } from '../theme/tokens';
import type { OHCA } from '../domain/useOHCA';
import { TimelineRow } from './TimelineRow';

// Reverse-chronological treatment timeline (FR-012).
export function Timeline({ o, t }: { o: OHCA; t: Theme }) {
  if (o.events.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: t.textFaint, fontSize: 13, padding: '26px 0' }}>
        尚未記錄任何處置
      </div>
    );
  }
  return (
    <div>
      {o.events.map((ev) => (
        <TimelineRow
          key={ev.id}
          t={t}
          ev={ev}
          caseStart={o.caseStart}
          onDelete={o.actions.removeEvent}
        />
      ))}
    </div>
  );
}
