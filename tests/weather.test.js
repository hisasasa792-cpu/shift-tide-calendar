import { test, eq, ok } from "./harness.js";
import { windDirName, weatherName, parseForecast, getForecast, hoursForDate, level } from "../src/weather.js";

function memStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

const PORT = { id: "katsuura", lat: 35.146, lon: 140.318 };

test("windDirName uses 16 Japanese points", () => {
  eq(windDirName(0), "北");
  eq(windDirName(11), "北");
  eq(windDirName(12), "北北東");
  eq(windDirName(45), "北東");
  eq(windDirName(350), "北");
  eq(windDirName(225), "南西");
});

test("weatherName maps WMO codes", () => {
  eq(weatherName(0), "晴");
  eq(weatherName(3), "曇");
  eq(weatherName(63), "雨");
  eq(weatherName(95), "雷");
});

const FC = { hourly: {
  time: ["2026-11-18T00:00", "2026-11-18T01:00"],
  wind_speed_10m: [3.2, 9.5], wind_direction_10m: [10, 225], wind_gusts_10m: [5.1, 14],
  precipitation: [0, 2.5], weather_code: [0, 63],
} };
const MARINE = { hourly: { time: ["2026-11-18T00:00", "2026-11-18T01:00"], wave_height: [0.8, 1.6] } };

test("parseForecast merges forecast and marine by hour", () => {
  const h = parseForecast(FC, MARINE);
  eq(h[1], { time: "2026-11-18T01:00", windSpeed: 9.5, windDir: 225, gust: 14, precip: 2.5, code: 63, wave: 1.6 });
});

test("parseForecast leaves wave null without marine data", () => {
  eq(parseForecast(FC, null)[0].wave, null);
});

test("hoursForDate filters by local date", () => {
  eq(hoursForDate(parseForecast(FC, MARINE), "2026-11-18").length, 2);
  eq(hoursForDate(parseForecast(FC, MARINE), "2026-11-19").length, 0);
});

test("level grades wind into amber and red", () => {
  eq(level("wind", 5), 0);
  eq(level("wind", 9), 1);
  eq(level("wind", 12), 2);
});

test("getForecast fetches and caches", async () => {
  const storage = memStorage();
  let calls = 0;
  const fetchFn = async (url) => {
    calls++;
    return { ok: true, json: async () => (url.includes("marine") ? MARINE : FC) };
  };
  const now = Date.UTC(2026, 10, 18);
  const r = await getForecast(PORT, { now, fetchFn, storage });
  eq(r.fetchedAt, now);
  eq(r.hours.length, 2);
  await getForecast(PORT, { now: now + 30 * 60000, fetchFn, storage });
  eq(calls, 2, "second call within 60 min uses cache");
});

test("getForecast falls back to stale cache on fetch failure", async () => {
  const old = Date.UTC(2026, 10, 18);
  const storage = memStorage({ "wx.katsuura": JSON.stringify({ fetchedAt: old, hours: [] }) });
  const fetchFn = async () => { throw new Error("offline"); };
  const r = await getForecast(PORT, { now: old + 3 * 3600000, fetchFn, storage });
  ok(r.error, "has error");
  eq(r.cached.fetchedAt, old);
});

test("getForecast reports error with no cache", async () => {
  const fetchFn = async () => { throw new Error("offline"); };
  const r = await getForecast(PORT, { now: 0, fetchFn, storage: memStorage() });
  ok(r.error, "has error");
  eq(r.cached, undefined);
});

test("getForecast treats a non-ok response as failure", async () => {
  const fetchFn = async () => ({ ok: false, status: 500, json: async () => ({}) });
  const r = await getForecast(PORT, { now: 0, fetchFn, storage: memStorage() });
  ok(r.error, "has error");
});
