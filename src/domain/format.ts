// Pure formatting + MAP helpers. Ported from ohca-core.jsx.

export const pad2 = (n: number): string => String(n).padStart(2, '0');

export const fmtTimeOfDay = (d: Date): string =>
  `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

// Elapsed mm:ss, extending to h:mm:ss past 60 minutes (FR-001 / Edge Cases).
export const fmtElapsed = (sec: number): string => {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${pad2(h)}:${pad2(m % 60)}:${pad2(s)}`;
  }
  return `${pad2(m)}:${pad2(s)}`;
};

// Countdown mm:ss; negative values render as +mm:ss (overdue).
export const fmtClock = (sec: number): string => {
  const neg = sec < 0;
  sec = Math.abs(Math.floor(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${neg ? '+' : ''}${pad2(m)}:${pad2(s)}`;
};

// Mean arterial pressure = dia + (sys - dia) / 3. Null if either value missing.
export const mapOf = (sys?: string, dia?: string): number | null => {
  const s = parseFloat(sys ?? '');
  const d = parseFloat(dia ?? '');
  if (!isFinite(s) || !isFinite(d)) return null;
  return Math.round(d + (s - d) / 3);
};
