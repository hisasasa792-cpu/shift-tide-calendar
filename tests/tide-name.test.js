import { test, eq } from "./harness.js";
import { lunarDay, tideName } from "../src/tide-name.js";
import { addDays } from "../src/date.js";

test("new moon dates (JST) are lunar day 1", () => {
  for (const d of ["2026-02-17", "2026-08-13", "2026-09-11", "2026-10-11", "2026-11-09"]) {
    eq(lunarDay(d), 1, d);
  }
});

test("tide names match the user's tide app for Oct 2026", () => {
  const truth = ["中","小","小","小","長","若","中","中","大","大","大","大","中","中","中","中",
                 "小","小","小","長","若","中","中","大","大","大","大","中","中","中","中"];
  truth.forEach((t, i) => {
    const d = addDays("2026-10-01", i);
    eq(tideName(d)[0], t, d);
  });
});

test("tide names are full words", () => {
  eq(tideName("2026-10-10"), "大潮");
  eq(tideName("2026-10-20"), "長潮");
});
