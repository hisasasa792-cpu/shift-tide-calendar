import { CREW, ANCHORS } from "./config.js";
import { daysBetween } from "./date.js";

const run = (s, n) => new Array(n).fill(s);

export const CYCLE = [
  ...run("乙", 5), ...run("休", 1), ...run("丙", 5), ...run("休", 2), ...run("甲", 5), ...run("休", 2),
];

export const SHIFT_HOURS = { "甲": "7:00–15:00", "乙": "15:00–23:00", "丙": "23:00–翌7:00", "休": "休み" };

export function shiftFor(date, crew = CREW) {
  const n = CYCLE.length;
  const i = ((daysBetween(ANCHORS[crew], date) % n) + n) % n;
  return CYCLE[i];
}
