// ohca-core.jsx — shared logic + tokens + atoms for the OHCA recorder
// Exports to window: useOHCA, OHCA_THEMES, RHYTHMS, AIRWAYS, ETT_SIZES,
// PRESET_TREATMENTS, EVENT_META, fmtClock, fmtElapsed, fmtTimeOfDay, pad2,
// NumPad, Sheet, Seg, ThemeToggle, useTheme, mapOf
'use strict';

/* ───────────────────────── helpers ───────────────────────── */
const pad2 = (n) => String(n).padStart(2, '0');
const fmtTimeOfDay = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
const fmtElapsed = (sec) => {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m >= 60) { const h = Math.floor(m / 60); return `${pad2(h)}:${pad2(m % 60)}:${pad2(s)}`; }
  return `${pad2(m)}:${pad2(s)}`;
};
const fmtClock = (sec) => { // mm:ss for countdowns, can go negative -> +mm:ss
  const neg = sec < 0; sec = Math.abs(Math.floor(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${neg ? '+' : ''}${pad2(m)}:${pad2(s)}`;
};
const mapOf = (sys, dia) => {
  const s = parseFloat(sys), d = parseFloat(dia);
  if (!isFinite(s) || !isFinite(d)) return null;
  return Math.round(d + (s - d) / 3);
};

/* ───────────────────────── domain constants ───────────────────────── */
const RHYTHMS = [
  { key: 'VF', label: 'VF 心室顫動', shockable: true },
  { key: 'pVT', label: 'pVT 無脈性室速', shockable: true },
  { key: 'PEA', label: 'PEA 無脈電氣活動', shockable: false },
  { key: 'Asystole', label: 'Asystole 心停', shockable: false },
  { key: 'ROSC', label: 'ROSC 自發循環', shockable: false },
];
const AIRWAYS = ['無', '口咽 OPA', '聲門上 i-gel', '氣管內管 ETT'];
const ETT_SIZES = ['6.5', '7.0', '7.5', '8.0'];
const PRESET_TREATMENTS = [
  'CPR 開始', 'CPR 暫停', 'BVM 給氧', '上 LUCAS', '抽痰',
  '建立 IV', '建立 IO', 'NaHCO₃', 'Atropine', '靜脈輸液', '12 導程', '交接'];

// visual identity for each event kind, consistent across all directions
const EVENT_META = {
  epi:     { tag: 'Epi',   name: '強心針 Epinephrine',  color: '#E5484D', glyph: '💉' },
  amio:    { tag: 'Amio',  name: '抗心律不整 Amiodarone', color: '#0E9C9C', glyph: '⚡' },
  defib:   { tag: '電擊',  name: '電擊 Defibrillation',  color: '#F0883E', glyph: '⚡' },
  iv:      { tag: 'IO/IV', name: 'IO/IV 建立',          color: '#C08A2E', glyph: '🩸' },
  rhythm:  { tag: '心律',  name: '心律分析',            color: '#6E56CF', glyph: '〜' },
  airway:  { tag: '氣管',  name: '氣道處置',            color: '#9F5BD6', glyph: '🫁' },
  vitals:  { tag: '徵象',  name: '生命徵象',            color: '#3E63DD', glyph: '📈' },
  rosc:    { tag: 'ROSC',  name: '恢復自發循環',        color: '#1FA463', glyph: '✓' },
  arrival: { tag: '到院',  name: '到達醫院',            color: '#9B1C2E', glyph: '🏥' },
  note:    { tag: '處置',  name: '處置紀錄',            color: '#7A8290', glyph: '•' },
};

const EPI_INTERVAL = 180;  // 3 min target for next dose
const AMIO_INTERVAL = 240; // 4 min
const CPR_CYCLE = 120;     // 2 min compression cycle

/* ───────────────────────── theme tokens ───────────────────────── */
const OHCA_THEMES = {
  dark: {
    name: 'dark',
    bg: '#0B0F14', bgGrad: 'radial-gradient(120% 80% at 50% -10%, #15202B 0%, #0B0F14 60%)',
    surface: '#121922', surface2: '#0E141B', raised: '#19222E',
    line: 'rgba(255,255,255,0.09)', lineStrong: 'rgba(255,255,255,0.16)',
    text: '#EAF1F8', textDim: '#8FA0B2', textFaint: '#5C6B7C',
    field: '#0C1218', fieldLine: 'rgba(255,255,255,0.14)',
    accent: '#3E63DD', shadow: '0 8px 30px rgba(0,0,0,0.45)',
  },
  light: {
    name: 'light',
    bg: '#EEF1F4', bgGrad: 'linear-gradient(180deg,#F6F8FA 0%,#E9EDF1 100%)',
    surface: '#FFFFFF', surface2: '#F4F6F8', raised: '#FFFFFF',
    line: 'rgba(15,30,50,0.10)', lineStrong: 'rgba(15,30,50,0.18)',
    text: '#121A24', textDim: '#5A6877', textFaint: '#94A1AE',
    field: '#FFFFFF', fieldLine: 'rgba(15,30,50,0.18)',
    accent: '#2D52D6', shadow: '0 6px 22px rgba(20,40,70,0.10)',
  },
};

/* ───────────────────────── the brain: useOHCA ─────────────────────────
   Single source of truth = the `events` array. All summary numbers (Epi /
   Amio / shock counts, initial rhythm, airway, IV, last vitals, drug
   countdowns) are DERIVED from it, so a long-press delete updates the whole
   UI consistently. caseStart / rosc / arrived / cpr are timers, kept apart. */
function useOHCA(opts) {
  opts = opts || {};
  const [now, setNow] = React.useState(() => new Date());
  const [caseStart, setCaseStart] = React.useState(() => Date.now() - (opts.seedElapsed || 0) * 1000);
  const [rosc, setRosc] = React.useState(null);        // timestamp
  const [arrived, setArrived] = React.useState(null);  // timestamp
  const [cpr, setCpr] = React.useState({ startAt: null });
  const [events, setEvents] = React.useState(() => (opts.seedEvents ? opts.seedEvents() : []));

  // single 1s heartbeat
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedSec = Math.floor((now.getTime() - caseStart) / 1000);
  const nowMs = now.getTime();

  const removeEvent = React.useCallback((id) => setEvents((l) => l.filter((e) => e.id !== id)), []);
  // pushes an event; `make` may use the prior list (for dose numbering)
  const push = React.useCallback((make) => {
    setEvents((list) => {
      const ev = typeof make === 'function' ? make(list) : make;
      const at = ev.at || Date.now();
      return [...list, { id: 'e' + at + Math.random().toString(36).slice(2, 6), at, ...ev }]
        .sort((a, b) => b.at - a.at);
    });
  }, []);

  // ── derived summary ──
  const countKind = (k) => events.filter((e) => e.kind === k).length;
  const lastOf = (k) => events.filter((e) => e.kind === k).reduce((m, e) => Math.max(m, e.at), -Infinity);
  const epiCount = countKind('epi');
  const amioCount = countKind('amio');
  const shocks = countKind('defib');
  const ivDone = events.some((e) => e.kind === 'iv');
  const epiLast = epiCount ? lastOf('epi') : null;
  const amioLast = amioCount ? lastOf('amio') : null;
  // initial rhythm = the earliest rhythm event
  const rhythmEvs = events.filter((e) => e.kind === 'rhythm').sort((a, b) => a.at - b.at);
  const initialRhythm = rhythmEvs.length ? (rhythmEvs[0].rhythm || rhythmEvs[0].label.replace('心律分析：', '')) : null;
  const lastRhythm = rhythmEvs.length ? (rhythmEvs[rhythmEvs.length - 1].rhythm || null) : null;
  // airway = latest airway event
  const airwayEvs = events.filter((e) => e.kind === 'airway').sort((a, b) => a.at - b.at);
  const airwayEv = airwayEvs[airwayEvs.length - 1];
  const airway = airwayEv ? { type: airwayEv.airwayType || '已建立', size: airwayEv.airwaySize || null } : { type: '無', size: null };
  const vitalsEvs = events.filter((e) => e.kind === 'vitals');
  const lastVitals = vitalsEvs.length ? vitalsEvs.reduce((m, e) => (e.at > m.at ? e : m)).vitals : null;

  const epi = { count: epiCount, lastAt: epiLast };
  const amio = { count: amioCount, lastAt: amioLast };

  // drug & CPR countdowns
  const epiRemain = epiLast == null ? null : EPI_INTERVAL - (nowMs - epiLast) / 1000;
  const amioRemain = amioLast == null ? null : AMIO_INTERVAL - (nowMs - amioLast) / 1000;
  const cprRemain = cpr.startAt == null ? null : CPR_CYCLE - (((nowMs - cpr.startAt) / 1000) % CPR_CYCLE);
  const cprCycleNum = cpr.startAt == null ? 0 : Math.floor((nowMs - cpr.startAt) / 1000 / CPR_CYCLE) + 1;

  const actions = React.useMemo(() => ({
    giveEpi(at) {
      push((list) => ({ kind: 'epi', at: at || Date.now(),
        label: `Epinephrine 第 ${list.filter((e) => e.kind === 'epi').length + 1} 劑` }));
    },
    giveAmio(at) {
      push((list) => ({ kind: 'amio', at: at || Date.now(),
        label: `Amiodarone 第 ${list.filter((e) => e.kind === 'amio').length + 1} 劑` }));
    },
    logDefib(at, joules) {
      push((list) => ({ kind: 'defib', at: at || Date.now(),
        label: `電擊 ${joules || 200}J（第 ${list.filter((e) => e.kind === 'defib').length + 1} 次）` }));
    },
    logIV(at) { push({ kind: 'iv', at: at || Date.now(), label: 'IO/IV 通路建立' }); },
    setRhythm(r, at) { push({ kind: 'rhythm', at: at || Date.now(), label: `心律分析：${r}`, rhythm: r }); },
    setAirwayDevice(type, size, at) {
      push({ kind: 'airway', at: at || Date.now(), label: `氣道：${type}${size ? ' ' + size : ''}`,
        airwayType: type, airwaySize: size || null });
    },
    addVitals(v, at) {
      const t = at || Date.now();
      const map = mapOf(v.sys, v.dia);
      const parts = [];
      if (v.sys || v.dia) parts.push(`BP ${v.sys || '–'}/${v.dia || '–'}${map ? ` (MAP ${map})` : ''}`);
      if (v.hr) parts.push(`HR ${v.hr}`);
      if (v.spo2) parts.push(`SpO₂ ${v.spo2}%`);
      if (v.etco2) parts.push(`EtCO₂ ${v.etco2}`);
      if (v.temp) parts.push(`T ${v.temp}°`);
      if (v.ecg) parts.push(v.ecg);
      push({ kind: 'vitals', at: t, label: '生命徵象', detail: parts.join('  ·  '), vitals: { ...v, map } });
    },
    addNote(label, at) { if (label) push({ kind: 'note', at: at || Date.now(), label }); },
    startCpr() { setCpr({ startAt: Date.now() }); },
    declareROSC() { const t = Date.now(); setRosc(t); push({ kind: 'rosc', at: t, label: '恢復自發循環 (ROSC)' }); },
    declareArrival() { const t = Date.now(); setArrived(t); push({ kind: 'arrival', at: t, label: '到達醫院' }); },
    newCase() {
      setCaseStart(Date.now()); setRosc(null); setArrived(null);
      setCpr({ startAt: null }); setEvents([]);
    },
    removeEvent,
  }), [push, removeEvent]);

  return {
    now, nowMs, elapsedSec, caseStart, rosc, arrived,
    epi, amio, shocks, initialRhythm, lastRhythm, airway, ivDone, events, lastVitals,
    epiRemain, amioRemain, cprRemain, cprCycleNum, cprActive: cpr.startAt != null,
    EPI_INTERVAL, AMIO_INTERVAL, CPR_CYCLE,
    actions,
  };
}

/* ───────────────────────── theme hook ───────────────────────── */
function useTheme(initial) {
  const [mode, setMode] = React.useState(initial || 'dark');
  const t = OHCA_THEMES[mode];
  return { mode, setMode, t, toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')) };
}

/* ───────────────────────── shared atoms ───────────────────────── */
// Theme toggle pill
function ThemeToggle({ mode, onToggle, t }) {
  return (
    <button onClick={onToggle} aria-label="切換日夜模式"
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999,
        border: `1px solid ${t.line}`, background: t.surface2, color: t.textDim,
        cursor: 'pointer', font: 'inherit', fontSize: 12, fontWeight: 600 }}>
      <span style={{ fontSize: 13 }}>{mode === 'dark' ? '🌙' : '☀️'}</span>
      {mode === 'dark' ? '夜間' : '白天'}
    </button>
  );
}

// Segmented control
function Seg({ options, value, onChange, t, size }) {
  const h = size === 'sm' ? 32 : 40;
  return (
    <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: t.surface2,
      border: `1px solid ${t.line}` }}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const lab = typeof o === 'string' ? o : o.label;
        const on = v === value;
        return (
          <button key={v} onClick={() => onChange(v)}
            style={{ flex: 1, height: h, borderRadius: 9, border: 'none', cursor: 'pointer',
              font: 'inherit', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', padding: '0 10px',
              background: on ? t.accent : 'transparent', color: on ? '#fff' : t.textDim,
              transition: 'background .15s, color .15s' }}>{lab}</button>
        );
      })}
    </div>
  );
}

// Bottom sheet (within phone frame, absolutely positioned)
function Sheet({ open, onClose, t, title, children, maxH }) {
  if (!open) return null;
  return (
    <div onClick={onClose}
      style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', background: 'rgba(3,7,12,0.55)', backdropFilter: 'blur(2px)' }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: t.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22,
          borderTop: `1px solid ${t.lineStrong}`, padding: '12px 16px 20px', maxHeight: maxH || '82%',
          overflowY: 'auto', boxShadow: '0 -16px 40px rgba(0,0,0,0.4)' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: t.lineStrong, margin: '2px auto 12px' }} />
        {title && <div style={{ fontSize: 17, fontWeight: 800, color: t.text, marginBottom: 12 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

// Numeric keypad — fast gloved-hand entry. value is a string.
function NumPad({ value, onChange, onDone, t, allowDot, suffix }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', allowDot ? '.' : '', '0', '⌫'];
  const press = (k) => {
    if (k === '') return;
    if (k === '⌫') return onChange(value.slice(0, -1));
    if (k === '.' && value.includes('.')) return;
    if (value.length >= 4) return;
    onChange(value + k);
  };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8,
        height: 60, marginBottom: 10, fontVariantNumeric: 'tabular-nums' }}>
        <span style={{ fontSize: 46, fontWeight: 800, color: t.text, letterSpacing: -1,
          fontFamily: 'var(--ohca-mono)' }}>{value || '0'}</span>
        {suffix && <span style={{ fontSize: 16, fontWeight: 700, color: t.textDim }}>{suffix}</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {keys.map((k, i) => (
          <button key={i} onClick={() => press(k)} disabled={k === ''}
            style={{ height: 56, borderRadius: 14, border: `1px solid ${t.line}`,
              background: k === '⌫' ? t.surface2 : t.field, color: t.text, cursor: k ? 'pointer' : 'default',
              font: 'inherit', fontSize: 24, fontWeight: 700, fontFamily: 'var(--ohca-mono)',
              opacity: k === '' ? 0 : 1 }}>{k}</button>
        ))}
      </div>
      <button onClick={onDone}
        style={{ width: '100%', height: 52, marginTop: 10, borderRadius: 14, border: 'none',
          background: t.accent, color: '#fff', font: 'inherit', fontSize: 17, fontWeight: 800,
          cursor: 'pointer' }}>確定</button>
    </div>
  );
}

Object.assign(window, {
  useOHCA, useTheme, OHCA_THEMES, RHYTHMS, AIRWAYS, ETT_SIZES, PRESET_TREATMENTS,
  EVENT_META, fmtClock, fmtElapsed, fmtTimeOfDay, pad2, mapOf,
  NumPad, Sheet, Seg, ThemeToggle,
});
