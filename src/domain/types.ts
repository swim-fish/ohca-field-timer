// Domain types — the single source of truth is the `events` array; all summary
// numbers are derived from it (see derive.ts). Ported from ohca-core.jsx.

export type EventKind =
  | 'epi'
  | 'amio'
  | 'defib'
  | 'iv'
  | 'rhythm'
  | 'airway'
  | 'vitals'
  | 'rosc'
  | 'arrival'
  | 'note';

export interface Vitals {
  sys?: string;
  dia?: string;
  map?: number | null;
  hr?: string;
  spo2?: string;
  etco2?: string;
  temp?: string;
  ecg?: string;
}

export interface OhcaEvent {
  id: string;
  at: number; // epoch ms
  kind: EventKind;
  label: string;
  detail?: string;
  rhythm?: string;
  airwayType?: string;
  airwaySize?: string | null;
  vitals?: Vitals;
}

export interface CprState {
  startAt: number | null;
}

// Note: ROSC and hospital-arrival are NOT stored here — they are derived from the
// latest 'rosc' / 'arrival' events (single source of truth, FR-016). Storing them
// separately would let a timeline delete desync the status indicator.
export interface CaseState {
  schemaVersion: number;
  caseStart: number;
  cpr: CprState;
  events: OhcaEvent[];
}

export interface EventMeta {
  tag: string;
  name: string;
  color: string;
  glyph: string;
}

// Rhythm-analysis input mode (feature 002). 進階 ACLS = full 5-rhythm picker;
// 簡易 AED = coarse 可電擊/不可電擊 decision. Persisted separately from the case.
export type RhythmMode = '進階 ACLS' | '簡易 AED';
