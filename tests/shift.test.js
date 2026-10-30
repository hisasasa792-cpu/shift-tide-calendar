import { test, eq } from "./harness.js";
import { shiftFor, SHIFT_HOURS, CYCLE } from "../src/shift.js";
import { addDays } from "../src/date.js";

test("cycle is 20 days", () => {
  eq(CYCLE.length, 20);
});

test("A crew matches the paper roster for Nov 2026", () => {
  const expected = {
    "2026-10-31": "乙", "2026-11-04": "乙", "2026-11-05": "休", "2026-11-06": "丙",
    "2026-11-10": "丙", "2026-11-11": "休", "2026-11-13": "甲", "2026-11-18": "休",
    "2026-11-20": "乙", "2026-11-25": "休", "2026-11-26": "丙", "2026-11-30": "丙",
  };
  for (const [d, s] of Object.entries(expected)) eq(shiftFor(d), s, d);
});

test("other crews match the paper roster", () => {
  eq(shiftFor("2026-11-01", "B"), "甲");
  eq(shiftFor("2026-11-03", "B"), "休");
  eq(shiftFor("2026-11-16", "B"), "休");
  eq(shiftFor("2026-11-01", "C"), "休");
  eq(shiftFor("2026-11-15", "C"), "休");
  eq(shiftFor("2026-11-13", "D"), "休");
  eq(shiftFor("2026-11-22", "D"), "丙");
});

test("dates before the anchor still follow the cycle", () => {
  eq(shiftFor("2025-01-01"), shiftFor(addDays("2025-01-01", 800)));
  eq(shiftFor("2026-10-30"), "休");
});

test("each day has exactly one crew on each working shift", () => {
  for (let i = 0; i < 30; i++) {
    const d = addDays("2026-11-01", i);
    const shifts = ["A", "B", "C", "D"].map((c) => shiftFor(d, c));
    for (const s of ["甲", "乙", "丙"]) eq(shifts.filter((x) => x === s).length, 1, `${d} ${s}`);
  }
});

test("shift hours are the agreed strings", () => {
  eq(SHIFT_HOURS, { "甲": "7:00–15:00", "乙": "15:00–23:00", "丙": "23:00–翌7:00", "休": "休み" });
});
