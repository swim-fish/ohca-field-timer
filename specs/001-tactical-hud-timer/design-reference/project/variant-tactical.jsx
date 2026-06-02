// variant-tactical.jsx — Direction A: Tactical HUD (dark-first command center)
'use strict';

function TacTile({ t, accent, kicker, big, sub, onClick, due, active }) {
  return (
    <button onClick={onClick}
      style={{ position: 'relative', textAlign: 'left', cursor: 'pointer', font: 'inherit',
        border: `1px solid ${due ? accent : t.line}`, borderRadius: 16, padding: '12px 13px',
        background: active ? `linear-gradient(160deg, ${accent}26, ${t.surface})` : t.surface,
        boxShadow: due ? `0 0 0 2px ${accent}, 0 0 22px ${accent}66` : 'none',
        overflow: 'hidden', minHeight: 104, display: 'flex', flexDirection: 'column',
        animation: due ? 'ohcaPulse 1s ease-in-out infinite' : 'none' }}>
      <span style={{ position: 'absolute', top: 12, right: 12, width: 9, height: 9, borderRadius: 9,
        background: accent, boxShadow: `0 0 10px ${accent}` }} />
      <span style={{ fontSize: 12.5, fontWeight: 800, color: accent, letterSpacing: 0.2 }}>{kicker}</span>
      <span style={{ marginTop: 'auto', fontSize: big.length > 5 ? 26 : 34, fontWeight: 800, color: t.text,
        fontFamily: 'var(--ohca-mono)', letterSpacing: -1, lineHeight: 1 }}>{big}</span>
      <span style={{ fontSize: 11.5, color: t.textDim, marginTop: 5, fontWeight: 600 }}>{sub}</span>
    </button>
  );
}

function VitalCell({ t, label, value, unit, accent, draft, onClick }) {
  return (
    <button onClick={onClick}
      style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', borderRadius: 13,
        border: `1px solid ${draft ? accent : t.line}`, background: t.field, padding: '9px 11px',
        display: 'flex', flexDirection: 'column', gap: 3, minHeight: 60 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: draft ? accent : t.textDim, letterSpacing: 0.2 }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: value ? t.text : t.textFaint,
          fontFamily: 'var(--ohca-mono)', letterSpacing: -0.5 }}>{value || '––'}</span>
        {unit && <span style={{ fontSize: 11, fontWeight: 600, color: t.textDim }}>{unit}</span>}
      </span>
    </button>
  );
}

function TimelineRow({ t, ev, caseStart, onDelete }) {
  const m = EVENT_META[ev.kind] || EVENT_META.note;
  const rel = fmtElapsed((ev.at - caseStart) / 1000);
  const [armed, setArmed] = React.useState(false);
  const hold = React.useRef(0);
  return (
    <div style={{ display: 'flex', gap: 11, position: 'relative' }}
      onPointerDown={() => { hold.current = setTimeout(() => setArmed(true), 550); }}
      onPointerUp={() => clearTimeout(hold.current)}
      onPointerLeave={() => clearTimeout(hold.current)}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 26 }}>
        <span style={{ width: 13, height: 13, borderRadius: 13, background: m.color, marginTop: 4,
          boxShadow: `0 0 0 3px ${m.color}33` }} />
        <span style={{ flex: 1, width: 2, background: t.line, marginTop: 3 }} />
      </div>
      <div style={{ flex: 1, paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: t.text, fontFamily: 'var(--ohca-mono)' }}>
            {fmtTimeOfDay(new Date(ev.at))}</span>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: m.color, background: m.color + '22',
            padding: '1px 7px', borderRadius: 999 }}>{m.tag}</span>
          <span style={{ fontSize: 10.5, color: t.textFaint, fontFamily: 'var(--ohca-mono)' }}>＋{rel}</span>
          {armed && (
            <button onClick={() => onDelete(ev.id)}
              style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#fff', background: '#E5484D',
                border: 'none', borderRadius: 7, padding: '3px 9px', cursor: 'pointer', font: 'inherit' }}>刪除</button>
          )}
        </div>
        <div style={{ fontSize: 13.5, color: t.text, fontWeight: 600, marginTop: 2 }}>{ev.label}</div>
        {ev.detail && <div style={{ fontSize: 12, color: t.textDim, marginTop: 2, fontFamily: 'var(--ohca-mono)' }}>{ev.detail}</div>}
      </div>
    </div>
  );
}

function OHCATactical({ seedElapsed, seedEvents }) {
  const o = useOHCA({ seedElapsed, seedEvents });
  const { mode, t, toggle } = useTheme('dark');
  const [draft, setDraft] = React.useState({});
  const [pad, setPad] = React.useState(null);   // {field,label,suffix,allowDot}
  const [rhythmOpen, setRhythmOpen] = React.useState(false);
  const [airwayOpen, setAirwayOpen] = React.useState(false);
  const [defibOpen, setDefibOpen] = React.useState(false);
  const map = mapOf(draft.sys, draft.dia);
  const hasDraft = Object.values(draft).some((v) => v != null && v !== '');

  const openPad = (field, label, suffix, allowDot) =>
    setPad({ field, label, suffix, allowDot, value: draft[field] || '' });

  const commitVitals = () => {
    if (!hasDraft) return;
    o.actions.addVitals(draft);
    setDraft({});
  };

  const VIT = [
    ['sys', '收縮壓 SBP', 'mmHg'], ['dia', '舒張壓 DBP', 'mmHg'], ['hr', '心跳 HR', '/分'],
    ['spo2', 'SpO₂', '%'], ['etco2', 'EtCO₂', 'mmHg'], ['temp', '體溫', '°C', true],
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: t.bgGrad, color: t.text,
      fontFamily: 'var(--ohca-sans)', position: 'relative' }}>
      {/* command bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: t.surface2 + 'F2',
        backdropFilter: 'blur(10px)', borderBottom: `1px solid ${t.line}`, padding: '14px 15px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: 8, background: o.rosc ? '#1FA463' : '#E5484D',
                boxShadow: `0 0 9px ${o.rosc ? '#1FA463' : '#E5484D'}`, animation: 'ohcaPulse 1.4s infinite' }} />
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.5, color: t.textDim }}>
                {o.rosc ? 'ROSC · 恢復循環' : 'OHCA · CPR 進行中'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginTop: 3 }}>
              <span style={{ fontSize: 42, fontWeight: 800, fontFamily: 'var(--ohca-mono)', letterSpacing: -2,
                lineHeight: 1 }}>{fmtElapsed(o.elapsedSec)}</span>
              <span style={{ fontSize: 11, color: t.textDim, fontWeight: 600 }}>經過</span>
            </div>
            <div style={{ fontSize: 11.5, color: t.textFaint, marginTop: 3, fontFamily: 'var(--ohca-mono)' }}>
              現在 {fmtTimeOfDay(o.now)}</div>
          </div>
          <ThemeToggle mode={mode} onToggle={toggle} t={t} />
        </div>

        {/* CPR cycle bar — smart cue */}
        <CprBar o={o} t={t} />

        {/* status actions */}
        <div style={{ display: 'flex', gap: 7, marginTop: 11 }}>
          <StatusBtn t={t} color="#1FA463" filled={!!o.rosc} label={o.rosc ? `ROSC ${fmtTimeOfDay(new Date(o.rosc))}` : 'ROSC'} onClick={() => !o.rosc && o.actions.declareROSC()} />
          <StatusBtn t={t} color="#9B1C2E" filled={!!o.arrived} label={o.arrived ? '已到院' : '到達醫院'} onClick={() => !o.arrived && o.actions.declareArrival()} />
          <StatusBtn t={t} color={t.textDim} label="新案件" onClick={() => { if (confirm('開始新案件？目前紀錄將清除。')) o.actions.newCase(); }} />
        </div>
      </div>

      <div style={{ padding: '13px 15px 26px' }}>
        {/* drug + action tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <TacTile t={t} accent="#E5484D" kicker="EPINEPHRINE 強心針"
            big={o.epiRemain == null ? '給藥' : (o.epiRemain <= 0 ? '可給藥' : fmtClock(o.epiRemain))}
            sub={o.epi.count ? `已給 ${o.epi.count} 劑 · 點擊再給` : '點擊登錄第一劑'}
            due={o.epiRemain != null && o.epiRemain <= 0} active={o.epi.count > 0}
            onClick={() => o.actions.giveEpi()} />
          <TacTile t={t} accent="#0E9C9C" kicker="AMIODARONE 抗心律"
            big={o.amioRemain == null ? '給藥' : (o.amioRemain <= 0 ? '可給藥' : fmtClock(o.amioRemain))}
            sub={o.amio.count ? `已給 ${o.amio.count} 劑 · 點擊再給` : '點擊登錄給藥'}
            due={o.amioRemain != null && o.amioRemain <= 0} active={o.amio.count > 0}
            onClick={() => o.actions.giveAmio()} />
          <TacTile t={t} accent="#F0883E" kicker="DEFIB 電擊"
            big={String(o.shocks)} sub="點擊登錄電擊次數" active={o.shocks > 0}
            onClick={() => setDefibOpen(true)} />
          <TacTile t={t} accent="#C08A2E" kicker="IO / IV 通路"
            big={o.events.some((e) => e.kind === 'iv') ? '已建立' : '建立'} sub="點擊登錄時間"
            active={o.events.some((e) => e.kind === 'iv')}
            onClick={() => o.actions.logIV()} />
          <TacTile t={t} accent="#6E56CF" kicker="心律分析"
            big={o.initialRhythm ? o.initialRhythm.split(' ')[0] : '分析'} sub="點擊登錄心律"
            active={!!o.initialRhythm} onClick={() => setRhythmOpen(true)} />
          <TacTile t={t} accent="#9F5BD6" kicker="氣道處置"
            big={o.airway.type === '無' ? '建立' : o.airway.type.split(' ')[0]}
            sub={o.airway.size ? `管徑 ${o.airway.size}` : '點擊登錄氣道'}
            active={o.airway.type !== '無'} onClick={() => setAirwayOpen(true)} />
        </div>

        {/* vitals HUD */}
        <SectionTitle t={t} title="生命徵象" hint="點格子用數字鍵盤輸入" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
          {VIT.map(([f, lab, unit, dot]) => (
            <VitalCell key={f} t={t} label={lab} unit={unit} value={draft[f]} accent={t.accent}
              draft={draft[f] != null && draft[f] !== ''} onClick={() => openPad(f, lab, unit, dot)} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 7, marginTop: 7 }}>
          <button onClick={() => setDraft((d) => ({ ...d }))}
            style={{ flex: '0 0 auto', padding: '0 12px', height: 44, borderRadius: 12, border: `1px solid ${t.line}`,
              background: t.field, color: t.textDim, font: 'inherit', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
            MAP {map != null ? map : '––'}
          </button>
          <input placeholder="ECG / 4-lead 註記" value={draft.ecg || ''}
            onChange={(e) => setDraft((d) => ({ ...d, ecg: e.target.value }))}
            style={{ flex: 1, height: 44, borderRadius: 12, border: `1px solid ${t.line}`, background: t.field,
              color: t.text, font: 'inherit', fontSize: 13, padding: '0 12px', outline: 'none' }} />
        </div>
        {hasDraft && (
          <button onClick={commitVitals}
            style={{ width: '100%', height: 50, marginTop: 8, borderRadius: 13, border: 'none',
              background: t.accent, color: '#fff', font: 'inherit', fontSize: 16, fontWeight: 800, cursor: 'pointer',
              boxShadow: `0 6px 18px ${t.accent}66` }}>
            登錄生命徵象 · {fmtTimeOfDay(o.now)}</button>
        )}

        {/* stats strip */}
        <SectionTitle t={t} title="處置摘要" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}>
          <MiniStat t={t} label="電擊" value={o.shocks} color="#F0883E" />
          <MiniStat t={t} label="Epi" value={o.epi.count} color="#E5484D" />
          <MiniStat t={t} label="Amio" value={o.amio.count} color="#0E9C9C" />
          <MiniStat t={t} label="心律" value={o.initialRhythm ? o.initialRhythm.split(' ')[0] : '未知'} color="#6E56CF" small />
        </div>

        {/* timeline */}
        <SectionTitle t={t} title="處置時間軸" hint={o.events.length ? '長按項目可刪除' : null} />
        {o.events.length === 0 ? (
          <div style={{ textAlign: 'center', color: t.textFaint, fontSize: 13, padding: '26px 0' }}>
            尚未記錄任何處置</div>
        ) : (
          <div>{o.events.map((ev) => (
            <TimelineRow key={ev.id} t={t} ev={ev} caseStart={o.caseStart} onDelete={o.actions.removeEvent} />
          ))}</div>
        )}
      </div>

      {/* numpad sheet */}
      <Sheet open={!!pad} onClose={() => setPad(null)} t={t} title={pad && pad.label}>
        {pad && (
          <NumPad value={pad.value} suffix={pad.suffix} allowDot={pad.allowDot} t={t}
            onChange={(v) => setPad((p) => ({ ...p, value: v }))}
            onDone={() => { setDraft((d) => ({ ...d, [pad.field]: pad.value })); setPad(null); }} />
        )}
      </Sheet>

      {/* rhythm picker */}
      <Sheet open={rhythmOpen} onClose={() => setRhythmOpen(false)} t={t} title="心律分析結果">
        <div style={{ display: 'grid', gap: 8 }}>
          {RHYTHMS.map((r) => (
            <button key={r.key} onClick={() => { o.actions.setRhythm(r.label); setRhythmOpen(false); }}
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

      {/* airway picker */}
      <Sheet open={airwayOpen} onClose={() => setAirwayOpen(false)} t={t} title="氣道處置">
        <AirwayPicker o={o} t={t} onDone={() => setAirwayOpen(false)} />
      </Sheet>

      {/* defib */}
      <Sheet open={defibOpen} onClose={() => setDefibOpen(false)} t={t} title="登錄電擊">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[150, 200, 250, 300, 360].map((j) => (
            <button key={j} onClick={() => { o.actions.logDefib(null, j); setDefibOpen(false); }}
              style={{ height: 60, borderRadius: 14, border: `1px solid ${t.line}`, background: t.field,
                color: t.text, font: 'inherit', fontSize: 20, fontWeight: 800, fontFamily: 'var(--ohca-mono)',
                cursor: 'pointer' }}>{j}J</button>
          ))}
          <button onClick={() => { o.actions.logDefib(null, 200); setDefibOpen(false); }}
            style={{ height: 60, borderRadius: 14, border: 'none', background: '#F0883E', color: '#fff',
              font: 'inherit', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>記錄一次</button>
        </div>
      </Sheet>

      <style>{`@keyframes ohcaPulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
    </div>
  );
}

function CprBar({ o, t }) {
  const danger = o.cprActive && o.cprRemain <= 15;
  const pct = o.cprActive ? (o.cprRemain / o.CPR_CYCLE) * 100 : 0;
  return (
    <div style={{ marginTop: 11, borderRadius: 13, border: `1px solid ${danger ? '#F0883E' : t.line}`,
      background: t.surface, padding: '9px 12px', boxShadow: danger ? '0 0 18px #F0883E55' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: t.textDim, letterSpacing: 0.3 }}>
          CPR 2 分鐘循環 {o.cprActive ? `· 第 ${o.cprCycleNum} 輪` : ''}</span>
        {o.cprActive ? (
          <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--ohca-mono)',
            color: danger ? '#F0883E' : t.text }}>{fmtClock(o.cprRemain)}</span>
        ) : (
          <button onClick={o.actions.startCpr}
            style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: t.accent, border: 'none',
              borderRadius: 8, padding: '4px 12px', cursor: 'pointer', font: 'inherit' }}>開始</button>
        )}
      </div>
      <div style={{ height: 6, borderRadius: 6, background: t.surface2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', borderRadius: 6,
          background: danger ? '#F0883E' : t.accent, transition: 'width .9s linear' }} />
      </div>
      {danger && <div style={{ fontSize: 11.5, fontWeight: 700, color: '#F0883E', marginTop: 6 }}>
        ⚠ 準備換手 · 心律檢查</div>}
    </div>
  );
}

function StatusBtn({ t, color, label, filled, onClick }) {
  return (
    <button onClick={onClick}
      style={{ flex: 1, height: 46, borderRadius: 13, cursor: 'pointer', font: 'inherit', fontSize: 13.5,
        fontWeight: 800, border: `1.5px solid ${color}`, padding: '0 6px',
        background: filled ? color : 'transparent', color: filled ? '#fff' : color,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</button>
  );
}

function SectionTitle({ t, title, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      margin: '18px 0 9px' }}>
      <span style={{ fontSize: 13, fontWeight: 800, color: t.text, letterSpacing: 0.3 }}>{title}</span>
      {hint && <span style={{ fontSize: 11, color: t.textFaint }}>{hint}</span>}
    </div>
  );
}

function MiniStat({ t, label, value, color, small }) {
  return (
    <div style={{ borderRadius: 13, border: `1px solid ${t.line}`, background: t.surface, padding: '10px 6px',
      textAlign: 'center' }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: t.textDim, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: small ? 14 : 26, fontWeight: 800, color, fontFamily: 'var(--ohca-mono)',
        letterSpacing: -0.5, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function AirwayPicker({ o, t, onDone }) {
  const [type, setType] = React.useState(o.airway.type);
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

Object.assign(window, { OHCATactical });
