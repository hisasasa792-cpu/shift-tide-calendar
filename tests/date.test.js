import { test, eq } from "./harness.js";
import { toISO, fromISO, addDays, daysBetween, weekday, monthGrid } from "../src/date.js";

test("toISO uses the local calendar date near midnight", () => {
  eq(toISO(new Date(2026, 10, 1, 0, 30)), "2026-11-01");
  eq(toISO(new Date(2026, 9, 31, 23, 59)), "2026-10-31");
});

test("fromISO round-trips through toISO", () => {
  eq(toISO(fromISO("2026-02-28")), "2026-02-28");
});

test("addDays crosses month boundaries both ways", () => {
  eq(addDays("2026-10-31", 1), "2026-11-01");
  eq(addDays("2026-11-20", -21), "2026-10-30");
});

test("daysBetween returns b minus a", () => {
  eq(daysBetween("2026-11-20", "2026-11-05"), -15);
  eq(daysBetween("2026-10-31", "2026-11-20"), 20);
});

test("weekday of 2026-11-01 is Sunday", () => {
  eq(weekday("2026-11-01"), 0);
});

test("monthGrid pads to a Sunday start", () => {
  const nov = monthGrid(2026, 11);
  eq(nov.length, 30);
  eq(nov[0], "2026-11-01");
  const oct = monthGrid(2026, 10);
  eq(oct.slice(0, 5), [null, null, null, null, "2026-10-01"]);
  eq(oct.length, 35);
});
