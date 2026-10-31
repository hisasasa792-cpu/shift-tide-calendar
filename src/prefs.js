import { ANCHORS } from "./config.js";

// Which crew's roster to show, and how far the year/month pickers reach.
export const CREWS = Object.keys(ANCHORS);
const CREW_KEY = "ui.crew";
const FIRST_YEAR = 2026;
const YEARS_AHEAD = 3;

export function getCrew(storage) {
  let c;
  try { c = storage?.getItem(CREW_KEY); } catch { /* storage blocked */ }
  return CREWS.includes(c) ? c : CREWS[0];
}

export function setCrew(storage, crew) {
  try { storage.setItem(CREW_KEY, crew); } catch { /* storage blocked */ }
}

export function yearRange(now = new Date()) {
  const last = now.getFullYear() + YEARS_AHEAD;
  return Array.from({ length: last - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);
}

// Keep [year, month] inside the pickable years.
export function clampMonth(year, month1, now = new Date()) {
  const years = yearRange(now);
  if (year < years[0]) return [years[0], 1];
  if (year > years[years.length - 1]) return [years[years.length - 1], 12];
  return [year, month1];
}
