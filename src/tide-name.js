import { daysBetween, fromISO } from "./date.js";

const RAD = Math.PI / 180;
const JST_MS = 9 * 60 * 60 * 1000;

// Julian Ephemeris Day of new moon number k (Meeus, Astronomical Algorithms ch. 49).
function newMoonJDE(k) {
  const T = k / 1236.85;
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  const M = (2.5534 + 29.1053567 * k - 0.0000014 * T * T) * RAD;
  const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T * T) * RAD;
  const F = (160.7108 + 390.67050284 * k - 0.0016118 * T * T) * RAD;
  const O = (124.7746 - 1.56375588 * k + 0.0020672 * T * T) * RAD;
  const s = Math.sin;
  const jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T;
  return jde
    - 0.4072 * s(Mp) + 0.17241 * E * s(M) + 0.01608 * s(2 * Mp) + 0.01039 * s(2 * F)
    + 0.00739 * E * s(Mp - M) - 0.00514 * E * s(Mp + M) + 0.00208 * E * E * s(2 * M)
    - 0.00111 * s(Mp - 2 * F) - 0.00057 * s(Mp + 2 * F) + 0.00056 * E * s(2 * Mp + M)
    - 0.00042 * s(3 * Mp) + 0.00042 * E * s(M + 2 * F) + 0.00038 * E * s(M - 2 * F)
    - 0.00024 * E * s(2 * Mp - M) - 0.00017 * s(O);
}

const jdToDate = (jd) => new Date((jd - 2440587.5) * 86400000);

// JST calendar date ("YYYY-MM-DD") of new moon number k.
function newMoonDateJST(k) {
  const d = new Date(jdToDate(newMoonJDE(k)).getTime() + JST_MS);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function approxK(date) {
  const d = fromISO(date);
  const year = d.getFullYear() + (d - new Date(d.getFullYear(), 0, 1)) / (365.25 * 86400000);
  return Math.floor((year - 2000) * 12.3685);
}

export function newMoonsAround(date) {
  const k = approxK(date);
  return [k - 1, k, k + 1, k + 2].map((n) => jdToDate(newMoonJDE(n)));
}

// 旧暦日: day 1 is the JST date containing the new moon.
export function lunarDay(date) {
  let k = approxK(date) + 2;
  while (daysBetween(newMoonDateJST(k), date) < 0) k--;
  return daysBetween(newMoonDateJST(k), date) + 1;
}

// Indexed by 旧暦日 (1–30); matches the user's tide app.
const NAMES = [null,
  "大潮", "大潮", "中潮", "中潮", "中潮", "中潮", "小潮", "小潮", "小潮", "長潮",
  "若潮", "中潮", "中潮", "大潮", "大潮", "大潮", "大潮", "中潮", "中潮", "中潮",
  "中潮", "小潮", "小潮", "小潮", "長潮", "若潮", "中潮", "中潮", "大潮", "大潮",
];

export function tideName(date) {
  return NAMES[Math.min(lunarDay(date), 30)];
}
