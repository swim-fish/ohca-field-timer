import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Theme } from '../theme/tokens';
import type { OhcaEvent } from '../domain/types';
import { EVENT_META } from '../domain/constants';
import { fmtElapsed, fmtTimeOfDay } from '../domain/format';
import { TOUCH_MIN } from '../theme/touch';

interface TimelineRowProps {
  t: Theme;
  ev: OhcaEvent;
  caseStart: number;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onOpen: (id: string | null) => void;
}

const BTN_W = 84; // revealed delete-button width
const DEADZONE = 6; // px before a drag direction is decided
const THRESHOLD = 42; // px of horizontal travel that latches the row open

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// One timeline entry. A horizontal swipe reveals a delete button (feature 002, FR-001).
// Open/closed is coordinated by the parent so only one row is armed at a time (FR-003).
export function TimelineRow({ t, ev, caseStart, onDelete, isOpen, onOpen }: TimelineRowProps) {
  const m = EVENT_META[ev.kind] ?? EVENT_META.note;
  const rel = fmtElapsed((ev.at - caseStart) / 1000);

  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const dirRef = useRef<'h' | 'v' | null>(null);

  // Single definition of the row's resting translate: open reveals the button, closed
  // sits flush. Used by the drag math and the rendered transform alike.
  const restingOffset = isOpen ? -BTN_W : 0;

  const onPointerDown = (e: ReactPointerEvent) => {
    startRef.current = { x: e.clientX, y: e.clientY };
    dirRef.current = null;
    setDragOffset(restingOffset);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (dirRef.current === null) {
      if (Math.abs(dx) > DEADZONE || Math.abs(dy) > DEADZONE) {
        // Lock direction on first decisive move: horizontal = swipe, vertical = scroll.
        dirRef.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        if (dirRef.current === 'h') {
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // pointer capture is best-effort
          }
        }
      }
    }
    if (dirRef.current === 'h') {
      setDragOffset(clamp(restingOffset + dx, -BTN_W, 0));
    }
  };

  const endDrag = () => {
    if (dirRef.current === 'h') {
      const off = dragOffset ?? 0;
      onOpen(off <= -THRESHOLD ? ev.id : null);
    }
    startRef.current = null;
    dirRef.current = null;
    setDragOffset(null);
  };

  const offset = dragOffset ?? restingOffset;
  const showDelete = offset < 0;

  return (
    <div
      role="listitem"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{ position: 'relative', overflow: 'hidden', touchAction: 'pan-y' }}
    >
      {showDelete && (
        <button
          onClick={() => {
            onDelete(ev.id);
            onOpen(null);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 14,
            width: BTN_W,
            minHeight: TOUCH_MIN,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 800,
            color: '#fff',
            background: '#E5484D',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          刪除
        </button>
      )}
      <div
        style={{
          display: 'flex',
          gap: 11,
          transform: `translateX(${offset}px)`,
          transition: dragOffset != null ? 'none' : 'transform .18s ease',
          background: t.surface,
        }}
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
    </div>
  );
}
