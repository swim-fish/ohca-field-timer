import { useState } from 'react';
import { useOHCA } from './domain/useOHCA';
import type { UseOhcaOpts } from './domain/useOHCA';
import { useTheme } from './theme/useTheme';
import { useRhythmMode } from './hooks/useRhythmMode';
import { useViewport } from './hooks/useViewport';
import type { PrefStore } from './persistence/prefStore';
import { CommandBar } from './components/CommandBar';
import { CprBar } from './components/CprBar';
import { StatusBtn } from './components/StatusBtn';
import { TacTile } from './components/TacTile';
import { SectionTitle } from './components/SectionTitle';
import { StatsStrip } from './components/StatsStrip';
import { VitalsHUD } from './components/VitalsHUD';
import { Timeline } from './components/Timeline';
import { Sheet } from './components/Sheet';
import { RhythmPicker } from './components/RhythmPicker';
import { AirwayPicker } from './components/AirwayPicker';
import { DefibSheet } from './components/DefibSheet';
import { fmtClock, fmtTimeOfDay } from './domain/format';

type AppProps = UseOhcaOpts & { prefStore?: PrefStore };

export default function App({ prefStore, ...ohcaOpts }: AppProps = {}) {
  const o = useOHCA(ohcaOpts);
  const { mode, t, toggle } = useTheme('dark');
  const [rhythmMode, setRhythmMode] = useRhythmMode(prefStore);
  const wide = useViewport();
  const [rhythmOpen, setRhythmOpen] = useState(false);
  const [airwayOpen, setAirwayOpen] = useState(false);
  const [defibOpen, setDefibOpen] = useState(false);

  const statusRow = (
    <div style={{ display: 'flex', gap: 7, marginTop: 11 }}>
      <StatusBtn
        t={t}
        color="#1FA463"
        filled={!!o.rosc}
        label={o.rosc ? `ROSC ${fmtTimeOfDay(new Date(o.rosc))}` : 'ROSC'}
        onClick={() => !o.rosc && o.actions.declareROSC()}
      />
      <StatusBtn
        t={t}
        color="#9B1C2E"
        filled={!!o.arrived}
        label={o.arrived ? '已到院' : '到達醫院'}
        onClick={() => !o.arrived && o.actions.declareArrival()}
      />
      <StatusBtn
        t={t}
        color={t.textDim}
        label="新案件"
        onClick={() => {
          if (confirm('開始新案件？目前紀錄將清除。')) o.actions.newCase();
        }}
      />
    </div>
  );

  const tiles = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <TacTile
        t={t}
        accent="#E5484D"
        kicker="EPINEPHRINE 強心針"
        big={o.epiRemain == null ? '給藥' : o.epiRemain <= 0 ? '可給藥' : fmtClock(o.epiRemain)}
        sub={o.epi.count ? `已給 ${o.epi.count} 劑 · 點擊再給` : '點擊登錄第一劑'}
        due={o.epiRemain != null && o.epiRemain <= 0}
        active={o.epi.count > 0}
        onClick={() => o.actions.giveEpi()}
      />
      <TacTile
        t={t}
        accent="#0E9C9C"
        kicker="AMIODARONE 抗心律"
        big={o.amioRemain == null ? '給藥' : o.amioRemain <= 0 ? '可給藥' : fmtClock(o.amioRemain)}
        sub={o.amio.count ? `已給 ${o.amio.count} 劑 · 點擊再給` : '點擊登錄給藥'}
        due={o.amioRemain != null && o.amioRemain <= 0}
        active={o.amio.count > 0}
        onClick={() => o.actions.giveAmio()}
      />
      <TacTile
        t={t}
        accent="#F0883E"
        kicker="DEFIB 電擊"
        big={String(o.shocks)}
        sub="點擊登錄電擊次數"
        active={o.shocks > 0}
        onClick={() => setDefibOpen(true)}
      />
      <TacTile
        t={t}
        accent="#C08A2E"
        kicker="IO / IV 通路"
        big={o.ivDone ? '已建立' : '建立'}
        sub="點擊登錄時間"
        active={o.ivDone}
        onClick={() => o.actions.logIV()}
      />
      <TacTile
        t={t}
        accent="#6E56CF"
        kicker="心律分析"
        big={o.initialRhythm ? o.initialRhythm.split(' ')[0]! : '分析'}
        sub="點擊登錄心律"
        active={!!o.initialRhythm}
        onClick={() => setRhythmOpen(true)}
      />
      <TacTile
        t={t}
        accent="#9F5BD6"
        kicker="氣道處置"
        big={o.airway.type === '無' ? '建立' : o.airway.type.split(' ')[0]!}
        sub={o.airway.size ? `管徑 ${o.airway.size}` : '點擊登錄氣道'}
        active={o.airway.type !== '無'}
        onClick={() => setAirwayOpen(true)}
      />
    </div>
  );

  const summary = (
    <>
      <SectionTitle t={t} title="處置摘要" />
      <StatsStrip o={o} t={t} />
    </>
  );

  const timelineSection = (
    <>
      <SectionTitle t={t} title="處置時間軸" hint={o.events.length ? '滑動項目可刪除' : null} />
      <Timeline o={o} t={t} />
    </>
  );

  const sheets = (
    <>
      <Sheet open={rhythmOpen} onClose={() => setRhythmOpen(false)} t={t} title="心律分析結果">
        <RhythmPicker
          t={t}
          mode={rhythmMode}
          onModeChange={setRhythmMode}
          onPick={(label) => o.actions.setRhythm(label)}
          onShock={() => o.actions.logDefib(null)}
          onDone={() => setRhythmOpen(false)}
        />
      </Sheet>

      <Sheet open={airwayOpen} onClose={() => setAirwayOpen(false)} t={t} title="氣道處置">
        <AirwayPicker
          t={t}
          current={o.airway}
          onConfirm={(type, size) => {
            o.actions.setAirwayDevice(type, size);
            setAirwayOpen(false);
          }}
        />
      </Sheet>

      <Sheet open={defibOpen} onClose={() => setDefibOpen(false)} t={t} title="登錄電擊">
        <DefibSheet
          t={t}
          onPick={(j) => {
            o.actions.logDefib(null, j);
            setDefibOpen(false);
          }}
        />
      </Sheet>
    </>
  );

  const rootStyle = {
    height: '100%',
    overflowY: 'auto' as const,
    background: t.bgGrad,
    color: t.text,
    fontFamily: 'var(--ohca-sans)',
    position: 'relative' as const,
  };

  // Landscape / wide: timers and actions sit beside a persistently visible timeline
  // (feature 002, FR-009). State lives in useOHCA, so re-parenting on rotation cannot
  // lose case data (FR-011). Only the body wrapper differs between layouts; the command
  // bar and sheets are shared so the two layouts cannot drift.
  const body = wide ? (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(340px, 1fr)',
        gap: 16,
        padding: '8px 18px 26px',
        alignItems: 'start',
      }}
    >
      <div>
        <CprBar o={o} t={t} />
        {statusRow}
        <div style={{ marginTop: 13 }}>
          {tiles}
          <VitalsHUD o={o} t={t} />
          {summary}
        </div>
      </div>
      <div data-testid="timeline-zone">{timelineSection}</div>
    </div>
  ) : (
    <>
      <div style={{ padding: '0 15px' }}>
        <CprBar o={o} t={t} />
        {statusRow}
      </div>
      <div style={{ padding: '13px 15px 26px' }}>
        {tiles}
        <VitalsHUD o={o} t={t} />
        {summary}
        <div data-testid="timeline-zone">{timelineSection}</div>
      </div>
    </>
  );

  return (
    <div data-testid="app-root" data-layout={wide ? 'wide' : 'narrow'} style={rootStyle}>
      <CommandBar o={o} t={t} mode={mode} onToggleTheme={toggle} />
      {body}
      {sheets}
    </div>
  );
}
