import { test, eq } from "./harness.js";
import { PORTS } from "../src/config.js";
import { loadTide } from "../src/tide-data.js";

test("ports are the four the user fishes at", () => {
  eq(PORTS.map((p) => p.name), ["勝浦", "小湊", "西川名", "布良"]);
});

test("bundled tide data holds exactly the stations the ports use", async () => {
  const stations = [...new Set(PORTS.map((p) => p.station))].sort();
  eq(Object.keys(await loadTide(2026)).sort(), stations);
});
