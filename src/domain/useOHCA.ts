// The brain: a single React hook whose source of truth is the `events` array.
// All summaries are derived (derive.ts); timers (caseStart/rosc/arrived/cpr) are
// kept apart. State autosaves to and restores from a CaseStore (FR-020).
// Ported and typed from ohca-core.jsx, extended with adjustStart (FR-001).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CaseState, OhcaEvent, Vitals } from './types';
import { SCHEMA_VERSION, EPI_INTERVAL, AMIO_INTERVAL, CPR_CYCLE } from './constants';
import { derive, countdowns, elapsedSec, type Derived, type Countdowns } from './derive';
import { mapOf } from './format';
import { createCaseStore, type CaseStore } from '../persistence/caseStore';

// Collision-resistant id: a per-session random base means counters cannot collide
// with ids minted before a reload (idCounter would otherwise reset to 0).
const idBase =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.floor(performance.now()).toString(36);
let idCounter = 0;
const makeId = (at: number): string => `e${at}_${idBase}_${(idCounter++).toString(36)}`;

function freshCase(start: number, seedEvents?: OhcaEvent[]): CaseState {
  return {
    schemaVersion: SCHEMA_VERSION,
    caseStart: start,
    cpr: { startAt: null },
    events: seedEvents ?? [],
  };
}

export interface OhcaActions {
  giveEpi(at?: number): void;
  giveAmio(at?: number): void;
  logDefib(at?: number | null, joules?: number): void;
  logIV(at?: number): void;
  setRhythm(label: string, at?: number): void;
  setAirwayDevice(type: string, size: string | null, at?: number): void;
  addVitals(v: Vitals, at?: number): void;
  addNote(label: string, at?: number): void;
  startCpr(): void;
  declareROSC(): void;
  declareArrival(): void;
  adjustStart(at: number): void;
  newCase(): void;
  removeEvent(id: string): void;
}

export interface OHCA extends Derived, Countdowns {
  now: Date;
  nowMs: number;
  elapsedSec: number;
  caseStart: number;
  events: OhcaEvent[];
  EPI_INTERVAL: number;
  AMIO_INTERVAL: number;
  CPR_CYCLE: number;
  actions: OhcaActions;
}

export interface UseOhcaOpts {
  store?: CaseStore;
  seedElapsed?: number;
  seedEvents?: () => OhcaEvent[];
  nowFn?: () => number;
}

export function useOHCA(opts: UseOhcaOpts = {}): OHCA {
  const nowFn = opts.nowFn ?? Date.now;
  const storeRef = useRef<CaseStore>(opts.store ?? createCaseStore());

  const [state, setState] = useState<CaseState>(() => {
    const restored = storeRef.current.load();
    if (restored) return restored;
    const start = nowFn() - (opts.seedElapsed ?? 0) * 1000;
    return freshCase(start, opts.seedEvents ? opts.seedEvents() : []);
  });

  const [now, setNow] = useState<Date>(() => new Date(nowFn()));

  // single 1s heartbeat
  useEffect(() => {
    const id = setInterval(() => setNow(new Date(nowFn())), 1000);
    return () => clearInterval(id);
  }, [nowFn]);

  // autosave on every state change
  useEffect(() => {
    storeRef.current.save(state);
  }, [state]);

  const nowMs = now.getTime();

  const pushEvent = useCallback(
    (make: (list: OhcaEvent[]) => Omit<OhcaEvent, 'id'>) => {
      setState((s) => {
        const partial = make(s.events);
        const at = partial.at ?? nowFn();
        const ev: OhcaEvent = { id: makeId(at), ...partial, at };
        return { ...s, events: [...s.events, ev].sort((a, b) => b.at - a.at) };
      });
    },
    [nowFn],
  );

  const derived = useMemo(() => derive(state.events), [state.events]);
  const cds = useMemo(() => countdowns(state, derived, nowMs), [state, derived, nowMs]);

  const actions = useMemo<OhcaActions>(
    () => ({
      giveEpi(at) {
        pushEvent((list) => ({
          kind: 'epi',
          at: at ?? nowFn(),
          label: `Epinephrine 第 ${list.filter((e) => e.kind === 'epi').length + 1} 劑`,
        }));
      },
      giveAmio(at) {
        pushEvent((list) => ({
          kind: 'amio',
          at: at ?? nowFn(),
          label: `Amiodarone 第 ${list.filter((e) => e.kind === 'amio').length + 1} 劑`,
        }));
      },
      logDefib(at, joules) {
        pushEvent((list) => ({
          kind: 'defib',
          at: at ?? nowFn(),
          label: `電擊 ${joules ?? 200}J（第 ${list.filter((e) => e.kind === 'defib').length + 1} 次）`,
        }));
      },
      logIV(at) {
        pushEvent(() => ({ kind: 'iv', at: at ?? nowFn(), label: 'IO/IV 通路建立' }));
      },
      setRhythm(label, at) {
        pushEvent(() => ({
          kind: 'rhythm',
          at: at ?? nowFn(),
          label: `心律分析：${label}`,
          rhythm: label,
        }));
      },
      setAirwayDevice(type, size, at) {
        pushEvent(() => ({
          kind: 'airway',
          at: at ?? nowFn(),
          label: `氣道：${type}${size ? ' ' + size : ''}`,
          airwayType: type,
          airwaySize: size ?? null,
        }));
      },
      addVitals(v, at) {
        const map = mapOf(v.sys, v.dia);
        const parts: string[] = [];
        if (v.sys || v.dia)
          parts.push(`BP ${v.sys || '–'}/${v.dia || '–'}${map ? ` (MAP ${map})` : ''}`);
        if (v.hr) parts.push(`HR ${v.hr}`);
        if (v.spo2) parts.push(`SpO₂ ${v.spo2}%`);
        if (v.etco2) parts.push(`EtCO₂ ${v.etco2}`);
        if (v.temp) parts.push(`T ${v.temp}°`);
        if (v.ecg) parts.push(v.ecg);
        pushEvent(() => ({
          kind: 'vitals',
          at: at ?? nowFn(),
          label: '生命徵象',
          detail: parts.join('  ·  '),
          vitals: { ...v, map },
        }));
      },
      addNote(label, at) {
        if (!label) return;
        pushEvent(() => ({ kind: 'note', at: at ?? nowFn(), label }));
      },
      startCpr() {
        setState((s) => ({ ...s, cpr: { startAt: nowFn() } }));
      },
      // ROSC / arrival are recorded ONLY as events; the status indicator derives
      // from them (FR-016), so deleting the event correctly reverts the status.
      declareROSC() {
        pushEvent(() => ({ kind: 'rosc', at: nowFn(), label: '恢復自發循環 (ROSC)' }));
      },
      declareArrival() {
        pushEvent(() => ({ kind: 'arrival', at: nowFn(), label: '到達醫院' }));
      },
      adjustStart(at) {
        setState((s) => ({ ...s, caseStart: at }));
      },
      newCase() {
        setState(freshCase(nowFn()));
      },
      removeEvent(id) {
        setState((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }));
      },
    }),
    [pushEvent, nowFn],
  );

  return {
    now,
    nowMs,
    elapsedSec: elapsedSec(state.caseStart, nowMs),
    caseStart: state.caseStart,
    events: state.events,
    ...derived,
    ...cds,
    EPI_INTERVAL,
    AMIO_INTERVAL,
    CPR_CYCLE,
    actions,
  };
}
