import { test, eq } from "./harness.js";
import { marksHtml, shiftChip } from "../src/ui/marks.js";
import { swipeDir } from "../src/ui/swipe.js";

test("marksHtml wraps only 残 and 早", () => {
  eq(marksHtml("残早会●"), `<span class="mk-y">残</span><span class="mk-y">早</span>会●`);
  eq(marksHtml(""), "");
});

test("swipeDir: left = forward, right = back, small or vertical = none", () => {
  eq(swipeDir(-80, 10), 1);
  eq(swipeDir(80, -10), -1);
  eq(swipeDir(40, 0), 0);
  eq(swipeDir(-80, 70), 0);
});

test("shiftChip shows red 年休 on the shift's colour, never on a 休 day", () => {
  eq(shiftChip("乙", true), `<span class="chip s-乙 nenkyu">年休</span>`);
  eq(shiftChip("乙", false), `<span class="chip s-乙">乙</span>`);
  eq(shiftChip("休", true), `<span class="chip s-休">休</span>`);
});
