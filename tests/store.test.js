import { test, eq, ok } from "./harness.js";
import { createStore } from "../src/store.js";

function memStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

test("add, list, update, delete round-trip", () => {
  const s = createStore(memStorage());
  const e = s.addEvent({ date: "2026-11-18", kind: "他", time: "11:00", title: "髭脱毛" });
  ok(e.id, "has id");
  eq(s.listEvents("2026-11-18").map((x) => x.title), ["髭脱毛"]);
  s.updateEvent({ ...e, title: "脱毛" });
  eq(s.listEvents("2026-11-18")[0].title, "脱毛");
  s.deleteEvent(e.id);
  eq(s.listEvents("2026-11-18"), []);
});

test("events persist through storage", () => {
  const st = memStorage();
  createStore(st).addEvent({ date: "2026-11-18", kind: "残", time: "", title: "" });
  eq(createStore(st).listEvents("2026-11-18").length, 1);
});

test("listEvents sorts 残/早 first, then by time, untimed last", () => {
  const s = createStore(memStorage());
  s.addEvent({ date: "2026-11-21", kind: "他", time: "", title: "メモ" });
  s.addEvent({ date: "2026-11-21", kind: "他", time: "19:00", title: "飲み会" });
  s.addEvent({ date: "2026-11-21", kind: "会", time: "13:00", title: "" });
  s.addEvent({ date: "2026-11-21", kind: "早", time: "", title: "" });
  eq(s.listEvents("2026-11-21").map((x) => x.kind + x.time), ["早", "会13:00", "他19:00", "他"]);
});

test("marksFor orders 残早会 then one ●", () => {
  const s = createStore(memStorage());
  s.addEvent({ date: "2026-11-08", kind: "会", time: "", title: "" });
  s.addEvent({ date: "2026-11-08", kind: "他", time: "", title: "a" });
  s.addEvent({ date: "2026-11-08", kind: "他", time: "", title: "b" });
  s.addEvent({ date: "2026-11-08", kind: "残", time: "", title: "" });
  eq(s.marksFor("2026-11-08"), "残会●");
  eq(s.marksFor("2026-11-09"), "");
});

test("addEvent rejects 他 without a title", () => {
  const s = createStore(memStorage());
  let threw = false;
  try { s.addEvent({ date: "2026-11-08", kind: "他", time: "", title: " " }); } catch { threw = true; }
  ok(threw, "throws");
});

test("export then import round-trips", () => {
  const a = createStore(memStorage());
  a.addEvent({ date: "2026-11-18", kind: "他", time: "11:00", title: "髭脱毛" });
  const b = createStore(memStorage());
  eq(b.importJSON(a.exportJSON()), { ok: true, count: 1 });
  eq(b.listEvents(), a.listEvents());
});

test("broken import leaves existing events untouched", () => {
  const s = createStore(memStorage());
  s.addEvent({ date: "2026-11-18", kind: "残", time: "", title: "" });
  eq(s.importJSON("{bad").ok, false);
  eq(s.importJSON('{"version":1,"events":[{"date":"x"}]}').ok, false);
  eq(s.listEvents().length, 1);
});

test("corrupted storage starts empty without throwing", () => {
  const s = createStore(memStorage({ "schedule.v1": "not json" }));
  eq(s.listEvents(), []);
});

test("leave days can be set, cleared and persist", () => {
  const st = memStorage();
  const s = createStore(st);
  eq(s.isLeave("2026-11-19"), false);
  s.setLeave("2026-11-19", true);
  eq(createStore(st).isLeave("2026-11-19"), true);
  s.setLeave("2026-11-19", true);
  eq(JSON.parse(st.getItem("schedule.v1")).leaves, ["2026-11-19"]);
  s.setLeave("2026-11-19", false);
  eq(s.isLeave("2026-11-19"), false);
});

test("leave days survive event changes", () => {
  const s = createStore(memStorage());
  s.setLeave("2026-11-19", true);
  const e = s.addEvent({ date: "2026-11-19", kind: "残" });
  s.deleteEvent(e.id);
  eq(s.isLeave("2026-11-19"), true);
});

test("export then import carries leave days", () => {
  const a = createStore(memStorage());
  a.setLeave("2026-11-19", true);
  a.addEvent({ date: "2026-11-18", kind: "残" });
  const b = createStore(memStorage());
  eq(b.importJSON(a.exportJSON()), { ok: true, count: 1 });
  eq(b.isLeave("2026-11-19"), true);
});

test("old backups without leave days still import", () => {
  const s = createStore(memStorage());
  s.setLeave("2026-11-19", true);
  eq(s.importJSON('{"version":1,"events":[]}'), { ok: true, count: 0 });
  eq(s.isLeave("2026-11-19"), false);
});

test("import rejects malformed leave days", () => {
  const s = createStore(memStorage());
  eq(s.importJSON('{"version":1,"events":[],"leaves":["11/19"]}').ok, false);
});

test("palette starts with the default emoji and can be edited", () => {
  const st = memStorage();
  const s = createStore(st);
  eq(s.palette(), ["🎣", "🎃", "⚽", "🎳", "⛳", "🎰", "🛒"]);
  eq(s.addToPalette(" 🏊 "), true);
  eq(s.addToPalette("🏊"), false, "no duplicates");
  eq(s.addToPalette("  "), false, "no blanks");
  s.removeFromPalette("🎃");
  eq(createStore(st).palette(), ["🎣", "⚽", "🎳", "⛳", "🎰", "🛒", "🏊"]);
});

test("an emptied palette stays empty", () => {
  const s = createStore(memStorage());
  for (const e of s.palette()) s.removeFromPalette(e);
  eq(s.palette(), []);
});

test("stamps toggle on a day, at most two", () => {
  const s = createStore(memStorage());
  eq(s.stampsFor("2026-11-19"), []);
  eq(s.toggleStamp("2026-11-19", "🎣"), true);
  eq(s.toggleStamp("2026-11-19", "⛳"), true);
  eq(s.toggleStamp("2026-11-19", "🛒"), false, "third is refused");
  eq(s.stampsFor("2026-11-19"), ["🎣", "⛳"]);
  s.toggleStamp("2026-11-19", "🎣");
  eq(s.stampsFor("2026-11-19"), ["⛳"]);
});

test("stamps stay after the emoji leaves the palette", () => {
  const s = createStore(memStorage());
  s.toggleStamp("2026-11-19", "🎣");
  s.removeFromPalette("🎣");
  eq(s.stampsFor("2026-11-19"), ["🎣"]);
});

test("export then import carries palette and stamps", () => {
  const a = createStore(memStorage());
  a.removeFromPalette("🎃");
  a.toggleStamp("2026-11-19", "🎣");
  a.setLeave("2026-11-20", true);
  const b = createStore(memStorage());
  eq(b.importJSON(a.exportJSON()).ok, true);
  eq(b.palette(), a.palette());
  eq(b.stampsFor("2026-11-19"), ["🎣"]);
  eq(b.isLeave("2026-11-20"), true);
});

test("old backups without emoji keep the default palette", () => {
  const s = createStore(memStorage());
  s.toggleStamp("2026-11-19", "🎣");
  eq(s.importJSON('{"version":1,"events":[]}').ok, true);
  eq(s.stampsFor("2026-11-19"), []);
  eq(s.palette().length, 7);
});

test("import rejects malformed stamps", () => {
  const s = createStore(memStorage());
  eq(s.importJSON('{"version":1,"events":[],"stamps":{"2026-11-19":["a","b","c"]}}').ok, false);
  eq(s.importJSON('{"version":1,"events":[],"stamps":{"x":["a"]}}').ok, false);
  eq(s.importJSON('{"version":1,"events":[],"palette":[1]}').ok, false);
});
