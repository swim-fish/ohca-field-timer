import { useEffect, useState } from 'react';
import type { Theme } from '../theme/tokens';
import type { OHCA } from '../domain/useOHCA';
import { TimelineRow } from './TimelineRow';

// Reverse-chronological treatment timeline (FR-012). Tracks which single row has its
// swipe-delete revealed so opening one closes any other (feature 002, FR-003).
export function Timeline({ o, t }: { o: OHCA; t: Theme }) {
  const [openId, setOpenId] = useState<string | null>(null);

  // When the event set changes (a new event is logged, or one is deleted), close any
  // open delete control so a freshly logged entry is never under an armed swipe (spec
  // edge case). Keyed on count: additions and removals both change it.
  const eventCount = o.events.length;
  useEffect(() => {
    setOpenId(null);
  }, [eventCount]);

  if (o.events.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: t.textFaint, fontSize: 13, padding: '26px 0' }}>
        尚未記錄任何處置
      </div>
    );
  }
  return (
    <div role="list">
      {o.events.map((ev) => (
        <TimelineRow
          key={ev.id}
          t={t}
          ev={ev}
          caseStart={o.caseStart}
          onDelete={o.actions.removeEvent}
          isOpen={openId === ev.id}
          onOpen={setOpenId}
        />
      ))}
    </div>
  );
}
