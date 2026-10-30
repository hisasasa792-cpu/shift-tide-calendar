// All dates are local calendar dates as "YYYY-MM-DD". Never use toISOString(): it shifts to UTC.

const pad = (n) => String(n).padStart(2, "0");
const DAY_MS = 24 * 60 * 60 * 1000;

export function toISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Noon keeps arithmetic safe from DST and midnight edge cases.
export function fromISO(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(s, n) {
  const d = fromISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function daysBetween(a, b) {
  return Math.round((fromISO(b) - fromISO(a)) / DAY_MS);
}

export function weekday(s) {
  return fromISO(s).getDay();
}

export function monthGrid(year, month1) {
  const first = `${year}-${pad(month1)}-01`;
  const cells = new Array(weekday(first)).fill(null);
  const days = new Date(year, month1, 0).getDate();
  for (let d = 1; d <= days; d++) cells.push(`${year}-${pad(month1)}-${pad(d)}`);
  return cells;
}
