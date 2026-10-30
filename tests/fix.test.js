import { test, eq, ok } from "./harness.js";
import { exportBackup } from "../src/ui/backup.js";
import { wxTable } from "../src/ui/day.js";

function loadClassic(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

test("networkFirst serves the cache when the network is too slow", async () => {
  await loadClassic("../src/net-first-sw.js");
  const slow = () => new Promise((r) => setTimeout(() => r({ ok: true, clone: () => ({}), from: "net" }), 500));
  const res = await globalThis.networkFirst({ url: "x" }, {
    fetchFn: slow, match: async () => ({ from: "cache" }), put: () => {}, timeoutMs: 50,
  });
  eq(res.from, "cache");
});

test("networkFirst returns the network response when it is fast", async () => {
  await loadClassic("../src/net-first-sw.js");
  let stored = false;
  const res = await globalThis.networkFirst({ url: "x" }, {
    fetchFn: async () => ({ ok: true, clone: () => ({}), from: "net" }),
    match: async () => ({ from: "cache" }), put: () => { stored = true; }, timeoutMs: 1000,
  });
  eq(res.from, "net");
  ok(stored, "fresh copy stored");
});

test("networkFirst waits for the network when nothing is cached", async () => {
  await loadClassic("../src/net-first-sw.js");
  const slow = () => new Promise((r) => setTimeout(() => r({ ok: true, clone: () => ({}), from: "net" }), 100));
  const res = await globalThis.networkFirst({ url: "x" }, {
    fetchFn: slow, match: async () => undefined, put: () => {}, timeoutMs: 20,
  });
  eq(res.from, "net");
});

test("exportBackup uses the share sheet when files can be shared", async () => {
  let shared = null;
  const nav = { canShare: () => true, share: async (d) => { shared = d; } };
  await exportBackup("{}", "b.json", { nav, doc: null });
  eq(shared.files[0].name, "b.json");
});

test("exportBackup falls back to a download link", async () => {
  let clicked = false;
  const doc = { createElement: () => ({ click: () => { clicked = true; } }) };
  await exportBackup("{}", "b.json", { nav: {}, doc });
  ok(clicked, "link clicked");
});

test("wxTable tolerates null values from the forecast", () => {
  const html = wxTable([{ time: "2026-11-18T05:00", windSpeed: null, windDir: null, gust: null, precip: null, code: null, wave: null }]);
  ok(html.includes("5時"), "row rendered");
  ok(!html.includes("null") && !html.includes("NaN"), "no null/NaN text");
});
