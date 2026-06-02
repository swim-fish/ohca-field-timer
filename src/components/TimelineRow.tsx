import { useRef, useState } from 'react';
import type { Theme } from '../theme/tokens';
import type { OhcaEvent } from '../domain/types';
import { EVENT_META } from '../domain/constants';
import { fmtElapsed, fmtTimeOfDay } from '../domain/format';

interface TimelineRowProps {
  t: Theme;
  ev: OhcaEvent;
  caseStart: number;
  onDelete: (id: string) => void;
}

// One timeline entry. A deliberate ~550ms long-press arms a delete button (FR-013).
export function TimelineRow({ t, ev, caseStart, onDelete }: TimelineRowProps) {
  const m = EVENT_META[ev.kind] ?? EVENT_META.note;
  const rel = fmtElapsed((ev.at - caseStart) / 1000);
  const [armed, setArmed] = useState(false);
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    hold.current = setTimeout(() => setArmed(true), 550);
  };
  const cancel = () => {
    if (hold.current) clearTimeout(hold.current);
  };
  // Moving off the row dismisses an armed delete so it can't linger un-cancellable.
  const leave = () => {
    cancel();
    setArmed(false);
  };

  return (
    <div
      style={{ display: 'flex', gap: 11, position: 'relative' }}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={leave}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 26 }}>
        <span
          style={{
            width: 13,
            height: 13,
            borderRadius: 13,
            background: m.color,
            marginTop: 4,
            boxShadow: `0 0 0 3px ${m.color}33`,
          }}
        />
        <span style={{ flex: 1, width: 2, background: t.line, marginTop: 3 }} />
      </div>
      <div style={{ flex: 1, paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: t.text,
              fontFamily: 'var(--ohca-mono)',
            }}
          >
            {fmtTimeOfDay(new Date(ev.at))}
          </span>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: m.color,
              background: m.color + '22',
              padding: '1px 7px',
              borderRadius: 999,
            }}
          >
            {m.tag}
          </span>
          <span style={{ fontSize: 10.5, color: t.textFaint, fontFamily: 'var(--ohca-mono)' }}>
            ＋{rel}
          </span>
          {armed && (
            <button
              onClick={() => onDelete(ev.id)}
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                background: '#E5484D',
                border: 'none',
                borderRadius: 7,
                padding: '3px 9px',
                cursor: 'pointer',
                font: 'inherit',
              }}
            >
              刪除
            </button>
          )}
        </div>
        <div style={{ fontSize: 13.5, color: t.text, fontWeight: 600, marginTop: 2 }}>
          {ev.label}
        </div>
        {ev.detail && (
          <div
            style={{
              fontSize: 12,
              color: t.textDim,
              marginTop: 2,
              fontFamily: 'var(--ohca-mono)',
            }}
          >
            {ev.detail}
          </div>
        )}
      </div>
    </div>
  );
}
