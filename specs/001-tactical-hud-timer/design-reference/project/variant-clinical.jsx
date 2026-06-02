// variant-clinical.jsx — Direction B: Clinical Cards (light-first, refined)
'use strict';

function ClDrugTile({ t, accent, title, sub, big, bigSm, sub2, due, onClick }) {
  return (
    <button onClick={onClick}
      style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', position: 'relative', overflow: 'hidden',
        border: 'none', borderRadius: 18, padding: '13px 14px', minHeight: 118, color: '#fff',
        display: 'flex', flexDirection: 'column',
        background: `linear-gradient(155deg, ${accent}, ${shade(accent, -22)})`,
        boxShadow: due ? `0 0 0 3px #fff, 0 0 0 6px ${accent}` : `0 6px 16px ${accent}55`,
        animation: due ? 'clPulse 1s infinite' : 'none' }}>
      <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: 0.2 }}>{title}</span>
      <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.85, marginTop: 1 }}>{sub}</span>
      <span style={{ marginTop: 'auto', fontSize: bigSm ? 22 : 34, fontWeight: 900, fontFamily: 'var(--ohca-mono)',
        letterSpacing: -1, lineHeight: 1 }}>{big}</span>
      <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.9, marginTop: 4 }}>{sub2}</span>
    </button>
  );
}

function shade(hex, amt) { // lighten/darken a #rrggbb by amt (-100..100)
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

// stepper-based vital input — fast adjust with +/- ; tap number to type
function ClStepper({ t, label, unit, value, onChange, step, big }) {
  const [editing, setEditing] = React.useState(false);
  const num = parseFloat(value);
  const bump = (d) => {
    const base = isFinite(num) ? num : 0;
    let v = Math.round((base + d) * 10) / 10;
    if (v < 0) v = 0;
    onChange(String(v));
  };
  return (
    <div style={{ background: t.field, border: `1px solid ${t.line}`, borderRadius: 14, padding: '8px 9px' }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: t.textDim, marginBottom: 6, textAlign: 'center' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={() => bump(-step)} aria-label="減"
          style={{ width: 34, height: 38, flex: '0 0 auto', borderRadius: 10, border: `1px solid ${t.line}`,
            background: t.surface2, color: t.text, font: 'inherit', fontSize: 22, fontWeight: 800, cursor: 'pointer',
            lineHeight: 1 }}>−</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          {editing ? (
            <input autoFocus value={value || ''} inputMode="decimal"
              onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))}
              onBlur={() => setEditing(false)}
              style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', outline: 'none',
                color: t.text, font: 'inherit', fontSize: 24, fontWeight: 800, fontFamily: 'var(--ohca-mono)' }} />
          ) : (
            <button onClick={() => setEditing(true)}
              style={{ border: 'none', background: 'transparent', cursor: 'text', font: 'inherit' }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: value ? t.text : t.textFaint,
                fontFamily: 'var(--ohca-mono)', letterSpacing: -0.5 }}>{value || '––'}</span>
            </button>
          )}
          {unit && <div style={{ fontSize: 10, color: t.textDim, fontWeight: 600, marginTop: -2 }}>{unit}</div>}
        </div>
        <button onClick={() => bump(step)} aria-label="加"
          style={{ width: 34, height: 38, flex: '0 0 auto', borderRadius: 10, border: `1px solid ${t.line}`,
            background: t.surface2, color: t.text, font: 'inherit', fontSize: 20, fontWeight: 800, cursor: 'pointer',
            lineHeight: 1 }}>+</button>
      </div>
    </div>
  );
}

function ClTimelineRow({ t, ev, caseStart, onDelete }) {
  const m = EVENT_META[ev.kind] || EVENT_META.note;
  const rel = fmtElapsed((ev.at - caseStart) / 1000);
  const [armed, setArmed] = React.useState(false);
  const hold = React.useRef(0);
  return (
    <div style={{ display: 'flex', gap: 11 }}
      onPointerDown={() => { hold.current = setTimeout(() => setArmed(true), 550); }}
      onPointerUp={() => clearTimeout(hold.current)}
      onPointerLeave={() => clearTimeout(hold.current)}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 22 }}>
        <span style={{ width: 12, height: 12, borderRadius: 12, background: m.color, marginTop: 4,
          boxShadow: `0 0 0 4px ${m.color}22` }} />
        <span style={{ flex: 1, width: 2, background: t.line, marginTop: 3 }} />
      </div>
      <div style={{ flex: 1, paddingBottom: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: t.text, fontFamily: 'var(--ohca-mono)' }}>
            {fmtTimeOfDay(new Date(ev.at))}</span>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: m.color, background: m.color + '1A',
            padding: '1px 7px', borderRadius: 999 }}>{m.tag}</span>
          <span style={{ fontSize: 10.5, color: t.textFaint, fontFamily: 'var(--ohca-mono)' }}>＋{rel}</span>
          {armed && (
            <button onClick={() => onDelete(ev.id)}
              style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#fff', background: '#E5484D',
                border: 'none', borderRadius: 7, padding: '3px 9px', cursor: 'pointer', font: 'inherit' }}>刪除</button>
          )}
        </div>
        <div style={{ fontSize: 13.5, color: t.text, fontWeight: 600, marginTop: 2 }}>{ev.label}</div>
        {ev.detail && <div style={{ fontSize: 12, color: t.textDim, marginTop: 1, fontFamily: 'var(--ohca-mono)' }}>{ev.detail}</div>}
      </div>
    </div>
  );
}

function ClCard({ t, children, style }) {
  return (
    <div style={{ background: t.surface, borderRadius: 18, border: `1px solid ${t.line}`,
      boxShadow: t.shadow, padding: 14, ...style }}>{children}</div>
  );
}
function ClHead({ t, children, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 11 }}>
      <span style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{children}</span>
      {hint && <span style={{ fontSize: 11, color: t.textFaint }}>{hint}</span>}
    </div>
  );
}

function OHCAClinical({ seedElapsed, seedEvents }) {
  const o = useOHCA({ seedElapsed, seedEvents });
  const { mode, t, toggle } = useTheme('light');
  const [v, setV] = React.useState({});
  const [preset, setPreset] = React.useState('');
  const [custom, setCustom] = React.useState('');
  const [rhythmOpen, setRhythmOpen] = React.useState(false);
  const [airwayOpen, setAirwayOpen] = React.useState(false);
  const set = (k) => (val) => setV((s) => ({ ...s, [k]: val }));
  const map = mapOf(v.sys, v.dia);
  const hasVitals = ['sys', 'dia', 'hr', 'spo2', 'etco2', 'temp', 'ecg'].some((k) => v[k]);

  const submit = () => {
    const name = custom.trim() || preset;
    if (name) o.actions.addNote(name);
    if (hasVitals) o.actions.addVitals(v);
    setV({}); setCustom(''); setPreset('');
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: t.bgGrad, color: t.text,
      fontFamily: 'var(--ohca-sans)', position: 'relative' }}>
      <div style={{ padding: '14px 14px 26px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* header card */}
        <ClCard t={t} style={{ padding: '14px 15px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, color: o.rosc ? '#1FA463' : '#9B1C2E' }}>
                {o.rosc ? 'ROSC · 恢復循環' : 'OHCA · 急救中'}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 40, fontWeight: 900, fontFamily: 'var(--ohca-mono)', letterSpacing: -2,
                  lineHeight: 1, color: t.text }}>{fmtElapsed(o.elapsedSec)}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.textDim }}>經過</span>
              </div>
              <div style={{ fontSize: 11.5, color: t.textFaint, marginTop: 3, fontFamily: 'var(--ohca-mono)' }}>
                現在 {fmtTimeOfDay(o.now)}　·　OHCA 現場計時與紀錄器</div>
            </div>
            <ThemeToggle mode={mode} onToggle={toggle} t={t} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <ClStatus t={t} color="#1FA463" filled={!!o.rosc} label={o.rosc ? `ROSC ${fmtTimeOfDay(new Date(o.rosc))}` : 'ROSC'} onClick={() => !o.rosc && o.actions.declareROSC()} />
            <ClStatus t={t} color="#9B1C2E" filled={!!o.arrived} label={o.arrived ? '已到院' : '到達醫院'} onClick={() => !o.arrived && o.actions.declareArrival()} />
            <ClStatus t={t} color={t.textDim} label="新案件" onClick={() => { if (confirm('開始新案件？目前紀錄將清除。')) o.actions.newCase(); }} />
          </div>
        </ClCard>

        {/* drug / action tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          <ClDrugTile t={t} accent="#E5484D" title="Epinephrine" sub="強心針"
            big={o.epiRemain == null ? '給藥' : (o.epiRemain <= 0 ? '可給藥' : fmtClock(o.epiRemain))}
            sub2={o.epi.count ? `已給 ${o.epi.count} 劑 · 再給` : '點擊登錄'}
            due={o.epiRemain != null && o.epiRemain <= 0} onClick={() => o.actions.giveEpi()} />
          <ClDrugTile t={t} accent="#0E9C9C" title="Amiodarone" sub="抗心律不整"
            big={o.amioRemain == null ? '給藥' : (o.amioRemain <= 0 ? '可給藥' : fmtClock(o.amioRemain))}
            sub2={o.amio.count ? `已給 ${o.amio.count} 劑 · 再給` : '點擊登錄'}
            due={o.amioRemain != null && o.amioRemain <= 0} onClick={() => o.actions.giveAmio()} />
          <ClDrugTile t={t} accent="#C08A2E" title="IO / IV 建立" sub="靜脈通路"
            big={o.ivDone ? '已建立' : '建立'} bigSm sub2="點擊登錄時間" onClick={() => o.actions.logIV()} />
          <ClDrugTile t={t} accent="#6E56CF" title="心律分析" sub="Rhythm"
            big={o.initialRhythm ? o.initialRhythm.split(' ')[0] : '分析'} bigSm sub2="點擊登錄結果"
            onClick={() => setRhythmOpen(true)} />
        </div>

        {/* manual entry / vitals — stepper paradigm */}
        <ClCard t={t}>
          <ClHead t={t} hint="＋／− 快速調整，點數字可輸入">手動補登 / 新增紀錄</ClHead>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <select value={preset} onChange={(e) => setPreset(e.target.value)}
              style={{ flex: 1, height: 44, borderRadius: 12, border: `1px solid ${t.fieldLine}`, background: t.field,
                color: preset ? t.text : t.textFaint, font: 'inherit', fontSize: 14, fontWeight: 600, padding: '0 10px',
                outline: 'none' }}>
              <option value="">— 選擇處置 —</option>
              {PRESET_TREATMENTS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={() => o.actions.addNote(custom.trim() || preset)}
              disabled={!preset && !custom.trim()}
              style={{ flex: '0 0 auto', padding: '0 18px', height: 44, borderRadius: 12, border: 'none',
                background: (preset || custom.trim()) ? t.accent : t.surface2,
                color: (preset || custom.trim()) ? '#fff' : t.textFaint, font: 'inherit', fontSize: 15,
                fontWeight: 800, cursor: 'pointer' }}>＋ 新增</button>
          </div>
          <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="或輸入自訂處置名稱…"
            style={{ width: '100%', height: 42, borderRadius: 12, border: `1px solid ${t.fieldLine}`, background: t.field,
              color: t.text, font: 'inherit', fontSize: 14, padding: '0 12px', outline: 'none', marginBottom: 12 }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <ClStepper t={t} label="收縮壓 SBP" unit="mmHg" value={v.sys} onChange={set('sys')} step={5} />
            <ClStepper t={t} label="舒張壓 DBP" unit="mmHg" value={v.dia} onChange={set('dia')} step={5} />
            <ClStepper t={t} label="心跳 HR" unit="/分" value={v.hr} onChange={set('hr')} step={5} />
            <ClStepper t={t} label="SpO₂" unit="%" value={v.spo2} onChange={set('spo2')} step={1} />
            <ClStepper t={t} label="EtCO₂" unit="mmHg" value={v.etco2} onChange={set('etco2')} step={1} />
            <ClStepper t={t} label="體溫" unit="°C" value={v.temp} onChange={set('temp')} step={0.1} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <div style={{ flex: '0 0 auto', padding: '0 12px', height: 42, display: 'flex', alignItems: 'center',
              borderRadius: 12, background: map != null ? '#3E63DD18' : t.surface2, color: map != null ? '#3E63DD' : t.textDim,
              fontSize: 12.5, fontWeight: 800, fontFamily: 'var(--ohca-mono)' }}>MAP {map != null ? map : '––'}</div>
            <input value={v.ecg || ''} onChange={set('ecg')} placeholder="ECG / 4-lead"
              style={{ flex: 1, height: 42, borderRadius: 12, border: `1px solid ${t.fieldLine}`, background: t.field,
                color: t.text, font: 'inherit', fontSize: 13.5, padding: '0 12px', outline: 'none' }} />
          </div>

          {(hasVitals || preset || custom.trim()) && (
            <button onClick={submit}
              style={{ width: '100%', height: 50, marginTop: 11, borderRadius: 13, border: 'none', background: t.accent,
                color: '#fff', font: 'inherit', fontSize: 16, fontWeight: 800, cursor: 'pointer',
                boxShadow: `0 6px 16px ${t.accent}55` }}>
              登錄 · {fmtTimeOfDay(o.now)}</button>
          )}
        </ClCard>

        {/* summary */}
        <ClCard t={t}>
          <ClHead t={t}>處置摘要</ClHead>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 9 }}>
            <ClBig t={t} label="最初心律" value={o.initialRhythm ? o.initialRhythm.split(' ')[0] : '未知'} color="#6E56CF"
              onClick={() => setRhythmOpen(true)} />
            <ClBig t={t} label="氣管管徑 / 深度" value={o.airway.type === '無' ? '無' : (o.airway.size || o.airway.type.split(' ')[0])} color="#9F5BD6"
              onClick={() => setAirwayOpen(true)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9 }}>
            <ClMini t={t} label="總電擊次數" value={o.shocks} color="#F0883E" />
            <ClMini t={t} label="Epi 強心針" value={o.epi.count} color="#E5484D" />
            <ClMini t={t} label="Amio" value={o.amio.count} color="#0E9C9C" />
          </div>
        </ClCard>

        {/* timeline */}
        <ClCard t={t}>
          <ClHead t={t} hint={o.events.length ? '長按項目可刪除' : null}>處置時間軸</ClHead>
          {o.events.length === 0 ? (
            <div style={{ textAlign: 'center', color: t.textFaint, fontSize: 13, padding: '22px 0' }}>尚未記錄任何處置</div>
          ) : (
            <div>{o.events.map((ev) => (
              <ClTimelineRow key={ev.id} t={t} ev={ev} caseStart={o.caseStart} onDelete={o.actions.removeEvent} />
            ))}</div>
          )}
        </ClCard>
      </div>

      <Sheet open={rhythmOpen} onClose={() => setRhythmOpen(false)} t={t} title="心律分析結果">
        <div style={{ display: 'grid', gap: 8 }}>
          {RHYTHMS.map((r) => (
            <button key={r.key} onClick={() => { o.actions.setRhythm(r.label); setRhythmOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 54,
                padding: '0 16px', borderRadius: 13, border: `1px solid ${t.line}`, background: t.field,
                color: t.text, font: 'inherit', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              {r.label}
              {r.shockable && <span style={{ fontSize: 11, fontWeight: 800, color: '#F0883E',
                background: '#F0883E1A', padding: '3px 9px', borderRadius: 999 }}>可電擊</span>}
            </button>
          ))}
        </div>
      </Sheet>
      <Sheet open={airwayOpen} onClose={() => setAirwayOpen(false)} t={t} title="氣道處置">
        <ClAirway o={o} t={t} onDone={() => setAirwayOpen(false)} />
      </Sheet>

      <style>{`@keyframes clPulse{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}`}</style>
    </div>
  );
}

function ClStatus({ t, color, label, filled, onClick }) {
  return (
    <button onClick={onClick}
      style={{ flex: 1, height: 46, borderRadius: 13, cursor: 'pointer', font: 'inherit', fontSize: 13.5,
        fontWeight: 800, border: `1.5px solid ${color}`, padding: '0 4px',
        background: filled ? color : 'transparent', color: filled ? '#fff' : color,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</button>
  );
}
function ClBig({ t, label, value, color, onClick }) {
  return (
    <button onClick={onClick}
      style={{ textAlign: 'center', cursor: 'pointer', font: 'inherit', borderRadius: 14, padding: '12px 8px',
        border: `1px solid ${t.line}`, background: t.surface2 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: t.textDim, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color }}>{value}</div>
    </button>
  );
}
function ClMini({ t, label, value, color }) {
  return (
    <div style={{ textAlign: 'center', borderRadius: 14, padding: '10px 6px', border: `1px solid ${t.line}`,
      background: t.surface2 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: t.textDim, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color, fontFamily: 'var(--ohca-mono)', lineHeight: 1 }}>{value}</div>
    </div>
  );
}
function ClAirway({ o, t, onDone }) {
  const [type, setType] = React.useState(o.airway.type === '無' ? AIRWAYS[3] : o.airway.type);
  const [size, setSize] = React.useState(o.airway.size || '7.5');
  const isETT = type === '氣管內管 ETT';
  return (
    <div>
      <div style={{ display: 'grid', gap: 7, marginBottom: 12 }}>
        {AIRWAYS.map((a) => (
          <button key={a} onClick={() => setType(a)}
            style={{ height: 50, borderRadius: 12, border: `1.5px solid ${type === a ? t.accent : t.line}`,
              background: type === a ? t.accent + '14' : t.field, color: t.text, font: 'inherit',
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

Object.assign(window, { OHCAClinical });
