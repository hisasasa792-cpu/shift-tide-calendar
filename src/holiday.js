// 国民の祝日 (Japanese public holidays) under the current law, worked out locally so it needs no network.
// Equinox days use the usual approximation, valid 1980–2099. A future change in the law needs an edit here.
import { toISO, addDays, weekday } from "./date.js";

const FIXED = [
  [1, 1, "元日"], [2, 11, "建国記念の日"], [2, 23, "天皇誕生日"], [4, 29, "昭和の日"],
  [5, 3, "憲法記念日"], [5, 4, "みどりの日"], [5, 5, "こどもの日"], [8, 11, "山の日"],
  [11, 3, "文化の日"], [11, 23, "勤労感謝の日"],
];
// [month, nth Monday, name]
const MONDAYS = [[1, 2, "成人の日"], [7, 3, "海の日"], [9, 3, "敬老の日"], [10, 2, "スポーツの日"]];

const iso = (y, m, d) => toISO(new Date(y, m - 1, d));

function nthMonday(y, m, n) {
  const first = new Date(y, m - 1, 1).getDay();
  return 1 + ((8 - first) % 7) + (n - 1) * 7;
}

function equinox(y, base) {
  const t = y - 1980;
  return Math.floor(base + 0.242194 * t - Math.floor(t / 4));
}

const cache = new Map();

// Map of "YYYY-MM-DD" → name, in date order.
export function holidaysOfYear(y) {
  if (cache.has(y)) return cache.get(y);
  const h = new Map();
  for (const [m, d, name] of FIXED) h.set(iso(y, m, d), name);
  for (const [m, n, name] of MONDAYS) h.set(iso(y, m, nthMonday(y, m, n)), name);
  h.set(iso(y, 3, equinox(y, 20.8431)), "春分の日");
  h.set(iso(y, 9, equinox(y, 23.2488)), "秋分の日");

  // 国民の休日: an ordinary day with a holiday on both sides.
  for (const d of [...h.keys()]) {
    const next = addDays(d, 1);
    if (!h.has(next) && h.has(addDays(d, 2)) && weekday(next) !== 0) h.set(next, "国民の休日");
  }
  // 振替休日: a holiday on a Sunday moves the day off to the next non-holiday.
  for (const d of [...h.keys()].filter((x) => weekday(x) === 0)) {
    let n = addDays(d, 1);
    while (h.has(n)) n = addDays(n, 1);
    h.set(n, "振替休日");
  }
  const sorted = new Map([...h].sort(([a], [b]) => a.localeCompare(b)));
  cache.set(y, sorted);
  return sorted;
}

export const holidayName = (date) => holidaysOfYear(Number(date.slice(0, 4))).get(date) ?? "";
