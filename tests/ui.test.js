import { test, eq } from "./harness.js";
import { marksHtml } from "../src/ui/marks.js";
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
