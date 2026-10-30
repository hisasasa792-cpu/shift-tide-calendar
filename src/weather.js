import { WARN } from "./config.js";

const DIRS = ["北", "北北東", "北東", "東北東", "東", "東南東", "南東", "南南東",
              "南", "南南西", "南西", "西南西", "西", "西北西", "北西", "北北西"];
const CACHE_MS = 60 * 60 * 1000;

export function windDirName(deg) {
  return DIRS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}

export function weatherName(code) {
  if (code <= 1) return "晴";
  if (code <= 3) return "曇";
  if (code === 45 || code === 48) return "霧";
  if (code >= 95) return "雷";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "雪";
  return "雨";
}

export function level(kind, value) {
  const [amber, red] = WARN[kind];
  if (value == null) return 0;
  return value >= red ? 2 : value >= amber ? 1 : 0;
}

export function parseForecast(fc, marine) {
  const h = fc.hourly;
  const waves = new Map();
  if (marine?.hourly) marine.hourly.time.forEach((t, i) => waves.set(t, marine.hourly.wave_height[i]));
  return h.time.map((time, i) => ({
    time,
    windSpeed: h.wind_speed_10m[i],
    windDir: h.wind_direction_10m[i],
    gust: h.wind_gusts_10m[i],
    precip: h.precipitation[i],
    code: h.weather_code[i],
    wave: waves.get(time) ?? null,
  }));
}

export function hoursForDate(hours, date) {
  return hours.filter((h) => h.time.startsWith(date));
}

function urls(port) {
  const q = `latitude=${port.lat}&longitude=${port.lon}&timezone=Asia%2FTokyo&forecast_days=7`;
  return {
    fc: `https://api.open-meteo.com/v1/forecast?${q}&wind_speed_unit=ms`
      + "&hourly=weather_code,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
    marine: `https://marine-api.open-meteo.com/v1/marine?${q}&hourly=wave_height`,
  };
}

function readCache(storage, key) {
  try {
    const v = JSON.parse(storage.getItem(key));
    return v && Array.isArray(v.hours) ? v : null;
  } catch {
    return null;
  }
}

async function getJSON(fetchFn, url) {
  const res = await fetchFn(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getForecast(port, { now = Date.now(), fetchFn = fetch, storage = localStorage, force = false } = {}) {
  const key = `wx.${port.id}`;
  const cached = readCache(storage, key);
  if (!force && cached && now - cached.fetchedAt < CACHE_MS) return cached;
  try {
    const u = urls(port);
    // Waves are optional: a marine failure still shows wind and weather.
    const [fc, marine] = await Promise.all([
      getJSON(fetchFn, u.fc),
      getJSON(fetchFn, u.marine).catch(() => null),
    ]);
    const result = { fetchedAt: now, hours: parseForecast(fc, marine) };
    try { storage.setItem(key, JSON.stringify(result)); } catch { /* storage full or blocked */ }
    return result;
  } catch (err) {
    return cached ? { error: err.message, cached } : { error: err.message };
  }
}
