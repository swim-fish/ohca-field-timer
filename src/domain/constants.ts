import type { EventKind, EventMeta } from './types';

export const SCHEMA_VERSION = 1;

export const EPI_INTERVAL = 180; // 3 min target for next dose
export const AMIO_INTERVAL = 240; // 4 min
export const CPR_CYCLE = 120; // 2 min compression cycle

export interface Rhythm {
  key: string;
  label: string;
  shockable: boolean;
}

export const RHYTHMS: Rhythm[] = [
  { key: 'VF', label: 'VF 心室顫動', shockable: true },
  { key: 'pVT', label: 'pVT 無脈性室速', shockable: true },
  { key: 'PEA', label: 'PEA 無脈電氣活動', shockable: false },
  { key: 'Asystole', label: 'Asystole 心停', shockable: false },
  { key: 'ROSC', label: 'ROSC 自發循環', shockable: false },
];

export const AIRWAYS = ['無', '口咽 OPA', '聲門上 i-gel', '氣管內管 ETT'] as const;
export const ETT_SIZES = ['6.5', '7.0', '7.5', '8.0'] as const;
export const DEFIB_JOULES = [150, 200, 250, 300, 360] as const;

export const PRESET_TREATMENTS = [
  'CPR 開始',
  'CPR 暫停',
  'BVM 給氧',
  '上 LUCAS',
  '抽痰',
  '建立 IV',
  '建立 IO',
  'NaHCO₃',
  'Atropine',
  '靜脈輸液',
  '12 導程',
  '交接',
];

// visual identity for each event kind — consistent across the whole UI (FR-018)
export const EVENT_META: Record<EventKind, EventMeta> = {
  epi: { tag: 'Epi', name: '強心針 Epinephrine', color: '#E5484D', glyph: '💉' },
  amio: { tag: 'Amio', name: '抗心律不整 Amiodarone', color: '#0E9C9C', glyph: '⚡' },
  defib: { tag: '電擊', name: '電擊 Defibrillation', color: '#F0883E', glyph: '⚡' },
  iv: { tag: 'IO/IV', name: 'IO/IV 建立', color: '#C08A2E', glyph: '🩸' },
  rhythm: { tag: '心律', name: '心律分析', color: '#6E56CF', glyph: '〜' },
  airway: { tag: '氣管', name: '氣道處置', color: '#9F5BD6', glyph: '🫁' },
  vitals: { tag: '徵象', name: '生命徵象', color: '#3E63DD', glyph: '📈' },
  rosc: { tag: 'ROSC', name: '恢復自發循環', color: '#1FA463', glyph: '✓' },
  arrival: { tag: '到院', name: '到達醫院', color: '#9B1C2E', glyph: '🏥' },
  note: { tag: '處置', name: '處置紀錄', color: '#7A8290', glyph: '•' },
};
