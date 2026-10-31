import { test, eq } from "./harness.js";
import { CREWS, getCrew, setCrew, yearRange, clampMonth } from "../src/prefs.js";

function memStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

test("crews are A to D", () => {
  eq(CREWS, ["A", "B", "C", "D"]);
});

test("crew defaults to A, remembers a choice, ignores junk", () => {
  const st = memStorage();
  eq(getCrew(st), "A");
  setCrew(st, "C");
  eq(getCrew(st), "C");
  st.setItem("ui.crew", "Z");
  eq(getCrew(st), "A");
  eq(getCrew(null), "A");
});

test("years run from 2026 to three years ahead", () => {
  eq(yearRange(new Date(2026, 9, 31)), [2026, 2027, 2028, 2029]);
  eq(yearRange(new Date(2027, 0, 1)), [2026, 2027, 2028, 2029, 2030]);
});

test("clampMonth keeps months inside the year range", () => {
  const now = new Date(2026, 9, 31);
  eq(clampMonth(2025, 12, now), [2026, 1]);
  eq(clampMonth(2030, 1, now), [2029, 12]);
  eq(clampMonth(2027, 5, now), [2027, 5]);
});
