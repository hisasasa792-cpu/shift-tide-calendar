import { test, eq, ok } from "./harness.js";
import { tideFor } from "../src/tide-data.js";

test("tideFor returns hourly heights and high/low times", async () => {
  const t = await tideFor("2026-11-18", "ZF");
  eq(t.hourly.length, 24);
  ok(t.high.length >= 1 && t.low.length >= 1, "has high and low");
  ok(/^\d\d:\d\d$/.test(t.high[0][0]), "HH:MM time");
  eq(t.high[0], ["11:55", 122]);
});

test("tideFor returns null for a year with no bundled data", async () => {
  eq(await tideFor("2028-01-01", "ZF"), null);
});

test("tideFor returns null for an unknown station", async () => {
  eq(await tideFor("2026-11-18", "XX"), null);
});
