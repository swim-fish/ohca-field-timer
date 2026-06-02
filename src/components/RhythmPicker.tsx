import { useState } from 'react';
import type { Theme } from '../theme/tokens';
import type { RhythmMode } from '../domain/types';
import { RHYTHMS, AED_OUTCOMES, RHYTHM_MODES } from '../domain/constants';
import { TOUCH_MIN } from '../theme/touch';
import { useTapGuard } from '../hooks/useTapGuard';
import { Seg } from './Seg';

interface RhythmPickerProps {
  t: Theme;
  mode: RhythmMode;
  onModeChange: (mode: RhythmMode) => void;
  onPick: (label: string) => void; // records a rhythm event (does NOT close the sheet)
  onShock: () => void; // logs a defibrillation shock (AED shortcut)
  onDone: () => void; // closes the sheet
}

const shockableBadge = (
  <span
    style={{
      fontSize: 11,
      fontWeight: 800,
      color: '#F0883E',
      background: '#F0883E22',
      padding: '3px 9px',
      borderRadius: 999,
    }}
  >
    可電擊
  </span>
);

// Rhythm analysis (feature 002): a 進階 ACLS ⇄ 簡易 AED toggle. Advanced mode keeps the
// 5-rhythm picker; AED mode records only a coarse 可電擊/不可電擊 outcome (FR-013) and
// offers a one-tap 已電擊 shortcut after 建議電擊 (FR-014). The coarse outcome is never
// mapped to a specific rhythm (FR-016). Action buttons are bounce-guarded (FR-008);
// each guard is an independent instance so a 建議電擊 → 已電擊 sequence is not
// cross-dropped — only a true double-tap of the same control is suppressed.
export function RhythmPicker({
  t,
  mode,
  onModeChange,
  onPick,
  onShock,
  onDone,
}: RhythmPickerProps) {
  const [pendingShock, setPendingShock] = useState(false);
  const rhythmGuard = useTapGuard();
  const outcomeGuard = useTapGuard();
  const shockGuard = useTapGuard();

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Seg
        options={RHYTHM_MODES}
        value={mode}
        onChange={(v) => onModeChange(v as RhythmMode)}
        t={t}
        size="lg"
      />

      {mode === '進階 ACLS' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {RHYTHMS.map((r) => (
            <button
              key={r.key}
              onClick={rhythmGuard(() => {
                onPick(r.label);
                onDone();
              })}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: TOUCH_MIN,
                padding: '0 16px',
                borderRadius: 13,
                border: `1px solid ${t.line}`,
                background: t.field,
                color: t.text,
                font: 'inherit',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {r.label}
              {r.shockable && shockableBadge}
            </button>
          ))}
        </div>
      )}

      {mode === '簡易 AED' && !pendingShock && (
        <div style={{ display: 'grid', gap: 8 }}>
          {AED_OUTCOMES.map((o) => {
            const word = o.key === 'shock' ? '建議電擊' : '不建議電擊';
            const sub = o.shockable ? '可電擊節律' : '不可電擊節律';
            return (
              <button
                key={o.key}
                onClick={outcomeGuard(() => {
                  onPick(o.label);
                  if (o.key === 'shock') setPendingShock(true);
                  else onDone();
                })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: 72,
                  padding: '0 18px',
                  borderRadius: 14,
                  border: `1px solid ${o.shockable ? '#F0883E' : t.line}`,
                  background: o.shockable ? '#F0883E18' : t.field,
                  color: t.text,
                  font: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <span style={{ display: 'grid', gap: 2, textAlign: 'left' }}>
                  <span style={{ fontSize: 20, fontWeight: 800 }}>{word}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: t.textDim }}>{sub}</span>
                </span>
                {o.shockable && shockableBadge}
              </button>
            );
          })}
        </div>
      )}

      {mode === '簡易 AED' && pendingShock && (
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>
            已記錄「建議電擊」。是否已執行電擊？
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              onClick={shockGuard(() => {
                onShock();
                onDone();
              })}
              style={{
                minHeight: TOUCH_MIN,
                borderRadius: 14,
                border: 'none',
                background: '#F0883E',
                color: '#fff',
                font: 'inherit',
                fontSize: 17,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              已電擊
            </button>
            <button
              onClick={onDone}
              style={{
                minHeight: TOUCH_MIN,
                borderRadius: 14,
                border: `1px solid ${t.line}`,
                background: t.field,
                color: t.textDim,
                font: 'inherit',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              略過
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
