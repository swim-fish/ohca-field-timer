// Pure derivations from the events array (single source of truth, FR-016).
import type { CaseState, OhcaEvent, EventKind, Vitals } from './types';
import { EPI_INTERVAL, AMIO_INTERVAL, CPR_CYCLE } from './constants';

export interface DrugSummary {
  count: number;
  lastAt: number | null;
}

export interface AirwaySummary {
  type: string;
  size: string | null;
}

export interface Derived {
  epi: DrugSummary;
  amio: DrugSummary;
  shocks: number;
  ivDone: boolean;
  initialRhythm: string | null;
  lastRhythm: string | null;
  airway: AirwaySummary;
  lastVitals: Vitals | null;
  rosc: number | null;
  arrived: number | null;
}

const countKind = (events: OhcaEvent[], k: EventKind): number =>
  events.filter((e) => e.kind === k).length;

const lastAtOf = (events: OhcaEvent[], k: EventKind): number | null => {
  const ats = events.filter((e) => e.kind === k).map((e) => e.at);
  return ats.length ? Math.max(...ats) : null;
};

export function derive(events: OhcaEvent[]): Derived {
  const epiCount = countKind(events, 'epi');
  const amioCount = countKind(events, 'amio');

  const rhythmEvs = events.filter((e) => e.kind === 'rhythm').sort((a, b) => a.at - b.at);
  const initialRhythm = rhythmEvs.at(0)?.rhythm ?? null;
  const lastRhythm = rhythmEvs.at(-1)?.rhythm ?? null;

  const airwayEvs = events.filter((e) => e.kind === 'airway').sort((a, b) => a.at - b.at);
  const airwayEv = airwayEvs[airwayEvs.length - 1];
  const airway: AirwaySummary = airwayEv
    ? { type: airwayEv.airwayType ?? '已建立', size: airwayEv.airwaySize ?? null }
    : { type: '無', size: null };

  const vitalsEvs = events.filter((e) => e.kind === 'vitals');
  const lastVitals = vitalsEvs.length
    ? (vitalsEvs.reduce((m, e) => (e.at > m.at ? e : m)).vitals ?? null)
    : null;

  return {
    epi: { count: epiCount, lastAt: epiCount ? lastAtOf(events, 'epi') : null },
    amio: { count: amioCount, lastAt: amioCount ? lastAtOf(events, 'amio') : null },
    shocks: countKind(events, 'defib'),
    ivDone: events.some((e) => e.kind === 'iv'),
    initialRhythm,
    lastRhythm,
    airway,
    lastVitals,
    rosc: lastAtOf(events, 'rosc'),
    arrived: lastAtOf(events, 'arrival'),
  };
}

export interface Countdowns {
  epiRemain: number | null;
  amioRemain: number | null;
  cprRemain: number | null;
  cprCycleNum: number;
  cprActive: boolean;
}

// Time-derived countdowns. Computed from wall-clock `nowMs` minus stored anchors so
// background/locked tabs stay accurate (research.md clock architecture).
export function countdowns(state: CaseState, derived: Derived, nowMs: number): Countdowns {
  const epiLast = derived.epi.lastAt;
  const amioLast = derived.amio.lastAt;
  const startAt = state.cpr.startAt;
  return {
    epiRemain: epiLast == null ? null : EPI_INTERVAL - (nowMs - epiLast) / 1000,
    amioRemain: amioLast == null ? null : AMIO_INTERVAL - (nowMs - amioLast) / 1000,
    cprRemain: startAt == null ? null : CPR_CYCLE - (((nowMs - startAt) / 1000) % CPR_CYCLE),
    cprCycleNum: startAt == null ? 0 : Math.floor((nowMs - startAt) / 1000 / CPR_CYCLE) + 1,
    cprActive: startAt != null,
  };
}

export const elapsedSec = (caseStart: number, nowMs: number): number =>
  Math.floor((nowMs - caseStart) / 1000);
