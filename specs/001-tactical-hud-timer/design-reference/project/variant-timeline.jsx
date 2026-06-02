// variant-timeline.jsx — Direction C: Timeline-first (live log is the hero)
'use strict';

function TlChip({ t, accent, label, value, badge, due, onClick }) {
  return (
    <button onClick={onClick}
      style={{ position: 'relative', flex: '0 0 auto', cursor: 'pointer', font: 'inherit',
        borderRadius: 14, padding: '9px 13px', minWidth: 78, textAlign: 'left',
        border: `1px solid ${due ? accent : t.line}`, background: due ? accent + '22' : t.surface,
        boxShadow: due ? `0 0 0 2px ${accent}, 0 0 16px ${accent}55` : 'none',
        animation: due ? 'tlPulse 1s infinite' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 8, background: accent, boxShadow: `0 0 8px ${accent}` }} />
        <span style={{ fontSize: 12, fontWeight: 800, color: t.text }}>{label}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: due ? accent : t.text, fontFamily: 'var(--ohca-mono)',
        marginTop: 4, letterSpacing: -0.5 }}>{value}</div>
      {badge != null && (
        <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, padding: '0 5px',
          borderRadius: 9, background: accent, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex',
          alignItems: 'center', justifyContent: 'center' }}>{badge}</span>
      )}
    </button>
  );
}

function TlEvent({ t, ev, caseStart, prevAt, onDelete, isFirst }) {
  const m = EVENT_META[ev.kind] || EVENT_META.note;
  const rel = fmtElapsed((ev.at - caseStart) / 1000);
  const gap = prevAt != null ? Math.round((prevAt - ev.at) / 1000) : null; // seconds since previous (older) — actually to next
  const [armed, setArmed] = React.useState(false);
  const hold = React.useRef(0);
  return (
    <div style={{ display: 'flex', gap: 12 }}
      onPointerDown={() => { hold.current = setTimeout(() => setArmed(true), 550); }}
      onPointerUp={() => clearTimeout(hold.current)}
      onPointerLeave={() => clearTimeout(hold.current)}>
      {/* time gutter */}
      <div style={{ width: 64, flex: '0 0 auto', textAlign: 'right', paddingTop: 2 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: t.text, fontFamily: 'var(--ohca-mono)', letterSpacing: -0.5 }}>
          {fmtTimeOfDay(new Date(ev.at)).slice(0, 5)}</div>
        <div style={{ fontSize: 10, color: t.textFaint, fontFamily: 'var(--ohca-mono)' }}>＋{rel}</div>
      </div>
      {/* rail */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 18, flex: '0 0 auto' }}>
        <span style={{ width: 15, height: 15, borderRadius: 15, background: m.color, marginTop: 3,
          boxShadow: `0 0 0 4px ${m.color}2A`, border: isFirst ? '2px solid #fff' : 'none' }} />
        <span style={{ flex: 1, width: 2.5, background: `linear-gradient(${m.color}55, ${t.line})`, marginTop: 2 }} />
      </div>
      {/* card */}
      <div style={{ flex: 1, marginBottom: 12, background: t.surface, border: `1px solid ${t.line}`,
        borderLeft: `3px solid ${m.color}`, borderRadius: 12, padding: '9px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: m.color, background: m.color + '22',
            padding: '1px 8px', borderRadius: 999 }}>{m.tag}</span>
          {isFirst && <span style={{ fontSize: 10, fontWeight: 700, color: t.textFaint }}>最新</span>}
          {armed && (
            <button onClick={() => onDelete(ev.id)}
              style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#fff', background: '#E5484D',
                border: 'none', borderRadius: 7, padding: '3px 9px', cursor: 'pointer', font: 'inherit' }}>刪除</button>
          )}
        </div>
        <div style={{ fontSize: 14.5, color: t.text, fontWeight: 700, marginTop: 4 }}>{ev.label}</div>
        {ev.detail && <div style={{ fontSize: 12.5, color: t.textDim, marginTop: 2, fontFamily: 'var(--ohca-mono)' }}>{ev.detail}</div>}
      </div>
    </div>
  );
}

function OHCATimeline({ seedElapsed, seedEvents }) {
  const o = useOHCA({ seedElapsed, seedEvents });
  const { mode, t, toggle } = useTheme('dark');
  const [sheet, setSheet] = React.useState(null); // 'vitals' | 'rhythm' | 'airway' | 'defib' | 'add'
  const [v, setV] = React.useState({});
  const setVK = (k) => (e) => setV((s) => ({ ...s, [k]: (e.target ? e.target.value : e) }));
  const map = mapOf(v.sys, v.dia);
  const hasVitals = ['sys', 'dia', 'hr', 'spo2', 'etco2', 'temp', 'ecg'].some((k) => v[k]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bgGrad, color: t.text,
      fontFamily: 'var(--ohca-sans)', position: 'relative' }}>

      {/* compact top bar */}
      <div style={{ flex: '0 0 auto', background: t.surface2 + 'F2', backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${t.line}`, padding: '12px 14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 9, height: 9, borderRadius: 9, background: o.rosc ? '#1FA463' : '#E5484D',
            boxShadow: `0 0 9px ${o.rosc ? '#1FA463' : '#E5484D'}`, animation: 'tlPulse 1.4s infinite' }} />
          <span style={{ fontSize: 34, fontWeight: 800, fontFamily: 'var(--ohca-mono)', letterSpacing: -1.5,
            lineHeight: 1 }}>{fmtElapsed(o.elapsedSec)}</span>
          <span style={{ fontSize: 10.5, color: t.textDim, fontWeight: 700 }}>經過<br />{fmtTimeOfDay(o.now)}</span>
          <div style={{ flex: 1 }} />
          <ThemeToggle mode={mode} onToggle={toggle} t={t} />
        </div>
        <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
          <TlStatus t={t} color="#1FA463" filled={!!o.rosc} label={o.rosc ? 'ROSC ✓' : 'ROSC'} onClick={() => !o.rosc && o.actions.declareROSC()} />
          <TlStatus t={t} color="#9B1C2E" filled={!!o.arrived} label={o.arrived ? '已到院' : '到達醫院'} onClick={() => !o.arrived && o.actions.declareArrival()} />
          <TlStatus t={t} color={t.textDim} label="新案件" onClick={() => { if (confirm('開始新案件？目前紀錄將清除。')) o.actions.newCase(); }} />
        </div>
        {/* CPR cue line */}
        <TlCpr o={o} t={t} />
      </div>

      {/* action rail (horizontal scroll) */}
      <div style={{ flex: '0 0 auto', display: 'flex', gap: 8, padding: '11px 14px', overflowX: 'auto',
        borderBottom: `1px solid ${t.line}` }}>
        <TlChip t={t} accent="#E5484D" label="Epi" badge={o.epi.count || null}
          value={o.epiRemain == null ? '給藥' : (o.epiRemain <= 0 ? '可給' : fmtClock(o.epiRemain))}
          due={o.epiRemain != null && o.epiRemain <= 0} onClick={() => o.actions.giveEpi()} />
        <TlChip t={t} accent="#0E9C9C" label="Amio" badge={o.amio.count || null}
          value={o.amioRemain == null ? '給藥' : (o.amioRemain <= 0 ? '可給' : fmtClock(o.amioRemain))}
          due={o.amioRemain != null && o.amioRemain <= 0} onClick={() => o.actions.giveAmio()} />
        <TlChip t={t} accent="#F0883E" label="電擊" badge={o.shocks || null} value="記錄" onClick={() => setSheet('defib')} />
        <TlChip t={t} accent="#C08A2E" label="IO/IV" value={o.ivDone ? '已建' : '建立'} onClick={() => o.actions.logIV()} />
        <TlChip t={t} accent="#6E56CF" label="心律" value={o.initialRhythm ? o.initialRhythm.split(' ')[0] : '分析'} onClick={() => setSheet('rhythm')} />
        <TlChip t={t} accent="#9F5BD6" label="氣道" value={o.airway.type === '無' ? '建立' : (o.airway.size || '已建')} onClick={() => setSheet('airway')} />
        <TlChip t={t} accent="#3E63DD" label="徵象" value={o.lastVitals ? '更新' : '輸入'} onClick={() => setSheet('vitals')} />
      </div>

      {/* hero timeline */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 90px' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: t.textDim, marginBottom: 12, letterSpacing: 0.5 }}>
          處置時間軸　·　{o.events.length} 筆紀錄</div>
        {o.events.length === 0 ? (
          <div style={{ textAlign: 'center', color: t.textFaint, fontSize: 13, padding: '40px 0' }}>尚未記錄任何處置</div>
        ) : (
          <div>{o.events.map((ev, i) => (
            <TlEvent key={ev.id} t={t} ev={ev} caseStart={o.caseStart} isFirst={i === 0}
              onDelete={o.actions.removeEvent} />
          ))}</div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setSheet('vitals')}
        style={{ position: 'absolute', right: 16, bottom: 18, width: 60, height: 60, borderRadius: 30,
          border: 'none', background: t.accent, color: '#fff', fontSize: 30, fontWeight: 700, cursor: 'pointer',
          boxShadow: `0 10px 26px ${t.accent}88`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>＋</button>

      {/* sheets */}
      <Sheet open={sheet === 'vitals'} onClose={() => setSheet(null)} t={t} title="快速生命徵象">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          <TlField t={t} label="收縮壓 SBP" unit="mmHg" value={v.sys} onChange={setVK('sys')} />
          <TlField t={t} label="舒張壓 DBP" unit="mmHg" value={v.dia} onChange={setVK('dia')} />
          <TlField t={t} label="心跳 HR" unit="/分" value={v.hr} onChange={setVK('hr')} />
          <TlField t={t} label="SpO₂" unit="%" value={v.spo2} onChange={setVK('spo2')} />
          <TlField t={t} label="EtCO₂" unit="mmHg" value={v.etco2} onChange={setVK('etco2')} />
          <TlField t={t} label="體溫" unit="°C" value={v.temp} onChange={setVK('temp')} dec />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
          <div style={{ flex: '0 0 auto', padding: '0 12px', height: 46, display: 'flex', alignItems: 'center',
            borderRadius: 12, background: map != null ? t.accent + '22' : t.surface2, color: map != null ? t.accent : t.textDim,
            fontSize: 13, fontWeight: 800, fontFamily: 'var(--ohca-mono)' }}>MAP {map != null ? map : '––'}</div>
          <input value={v.ecg || ''} onChange={setVK('ecg')} placeholder="ECG / 4-lead 註記"
            style={{ flex: 1, height: 46, borderRadius: 12, border: `1px solid ${t.fieldLine}`, background: t.field,
              color: t.text, font: 'inherit', fontSize: 14, padding: '0 12px', outline: 'none' }} />
        </div>
        <button onClick={() => { if (hasVitals) o.actions.addVitals(v); setV({}); setSheet(null); }}
          disabled={!hasVitals}
          style={{ width: '100%', height: 52, marginTop: 12, borderRadius: 13, border: 'none',
            background: hasVitals ? t.accent : t.surface2, color: hasVitals ? '#fff' : t.textFaint,
            font: 'inherit', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
          登錄到時間軸 · {fmtTimeOfDay(o.now)}</button>
      </Sheet>

      <Sheet open={sheet === 'rhythm'} onClose={() => setSheet(null)} t={t} title="心律分析結果">
        <div style={{ display: 'grid', gap: 8 }}>
          {RHYTHMS.map((r) => (
            <button key={r.key} onClick={() => { o.actions.setRhythm(r.label); setSheet(null); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 54,
                padding: '0 16px', borderRadius: 13, border: `1px solid ${t.line}`, background: t.field,
                color: t.text, font: 'inherit', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              {r.label}
              {r.shockable && <span style={{ fontSize: 11, fontWeight: 800, color: '#F0883E',
                background: '#F0883E22', padding: '3px 9px', borderRadius: 999 }}>可電擊</span>}
            </button>
          ))}
        </div>
      </Sheet>
      <Sheet open={sheet === 'airway'} onClose={() => setSheet(null)} t={t} title="氣道處置">
        <TlAirway o={o} t={t} onDone={() => setSheet(null)} />
      </Sheet>
      <Sheet open={sheet === 'defib'} onClose={() => setSheet(null)} t={t} title="登錄電擊">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[150, 200, 250, 300, 360].map((j) => (
            <button key={j} onClick={() => { o.actions.logDefib(null, j); setSheet(null); }}
              style={{ height: 60, borderRadius: 14, border: `1px solid ${t.line}`, background: t.field,
                color: t.text, font: 'inherit', fontSize: 20, fontWeight: 800, fontFamily: 'var(--ohca-mono)',
                cursor: 'pointer' }}>{j}J</button>
          ))}
          <button onClick={() => { o.actions.logDefib(null, 200); setSheet(null); }}
            style={{ height: 60, borderRadius: 14, border: 'none', background: '#F0883E', color: '#fff',
              font: 'inherit', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>記錄一次</button>
        </div>
      </Sheet>

      <style>{`@keyframes tlPulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
    </div>
  );
}

function TlStatus({ t, color, label, filled, onClick }) {
  return (
    <button onClick={onClick}
      style={{ flex: 1, height: 40, borderRadius: 11, cursor: 'pointer', font: 'inherit', fontSize: 13,
        fontWeight: 800, border: `1.5px solid ${color}`, padding: '0 4px',
        background: filled ? color : 'transparent', color: filled ? '#fff' : color,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</button>
  );
}
function TlField({ t, label, unit, value, onChange, dec }) {
  return (
    <div style={{ background: t.field, border: `1px solid ${t.line}`, borderRadius: 13, padding: '8px 11px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: t.textDim, marginBottom: 3 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <input value={value || ''} onChange={onChange} inputMode={dec ? 'decimal' : 'numeric'} placeholder="––"
          style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: t.text,
            font: 'inherit', fontSize: 24, fontWeight: 800, fontFamily: 'var(--ohca-mono)', letterSpacing: -0.5 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: t.textDim, flex: '0 0 auto' }}>{unit}</span>
      </div>
    </div>
  );
}
function TlCpr({ o, t }) {
  if (!o.cprActive) {
    return (
      <button onClick={o.actions.startCpr}
        style={{ width: '100%', marginTop: 9, height: 34, borderRadius: 10, border: `1px dashed ${t.line}`,
          background: 'transparent', color: t.textDim, font: 'inherit', fontSize: 12.5, fontWeight: 700,
          cursor: 'pointer' }}>▶ 開始 CPR 2 分鐘循環計時</button>
    );
  }
  const danger = o.cprRemain <= 15;
  const pct = (o.cprRemain / o.CPR_CYCLE) * 100;
  return (
    <div style={{ marginTop: 9 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: danger ? '#F0883E' : t.textDim }}>
          {danger ? '⚠ 準備換手 · 心律檢查' : `CPR 循環 · 第 ${o.cprCycleNum} 輪`}</span>
        <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--ohca-mono)', color: danger ? '#F0883E' : t.text }}>
          {fmtClock(o.cprRemain)}</span>
      </div>
      <div style={{ height: 5, borderRadius: 5, background: t.surface, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: danger ? '#F0883E' : t.accent,
          transition: 'width .9s linear' }} />
      </div>
    </div>
  );
}
function TlAirway({ o, t, onDone }) {
  const [type, setType] = React.useState(o.airway.type === '無' ? AIRWAYS[3] : o.airway.type);
  const [size, setSize] = React.useState(o.airway.size || '7.5');
  const isETT = type === '氣管內管 ETT';
  return (
    <div>
      <div style={{ display: 'grid', gap: 7, marginBottom: 12 }}>
        {AIRWAYS.map((a) => (
          <button key={a} onClick={() => setType(a)}
            style={{ height: 50, borderRadius: 12, border: `1.5px solid ${type === a ? t.accent : t.line}`,
              background: type === a ? t.accent + '1A' : t.field, color: t.text, font: 'inherit',
              fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>{a}</button>
        ))}
      </div>
      {isETT && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.textDim, marginBottom: 6 }}>管徑 / 深度</div>
          <Seg t={t} options={ETT_SIZES} value={size} onChange={setSize} />
        </div>
      )}
      <button onClick={() => { o.actions.setAirwayDevice(type, isETT ? size : null); onDone(); }}
        style={{ width: '100%', height: 52, borderRadius: 13, border: 'none', background: t.accent,
          color: '#fff', font: 'inherit', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>登錄氣道處置</button>
    </div>
  );
}

Object.assign(window, { OHCATimeline });
