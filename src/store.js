// Personal events and 年休 (annual leave) days, kept in localStorage. kind: 残 / 早 / 会 / 他.

const KEY = "schedule.v1";
const KINDS = ["残", "早", "会", "他"];
const MARK_ORDER = ["残", "早", "会"];

function valid(e) {
  return e && typeof e === "object"
    && /^\d{4}-\d\d-\d\d$/.test(e.date)
    && KINDS.includes(e.kind)
    && (e.time === "" || /^\d\d:\d\d$/.test(e.time))
    && typeof e.title === "string"
    && (e.kind !== "他" || e.title.trim() !== "");
}

function normalize(e) {
  const timeless = e.kind === "残" || e.kind === "早";
  return {
    date: e.date,
    kind: e.kind,
    time: timeless ? "" : (e.time || ""),
    title: timeless ? "" : (e.title || "").trim(),
  };
}

const isDate = (s) => typeof s === "string" && /^\d{4}-\d\d-\d\d$/.test(s);

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function sortKey(e) {
  const rank = e.kind === "残" || e.kind === "早" ? 0 : e.time ? 1 : 2;
  return `${rank}${e.time}`;
}

export function createStore(storage) {
  function read() {
    try {
      return JSON.parse(storage.getItem(KEY)) ?? {};
    } catch {
      return {};
    }
  }

  function load() {
    const v = read();
    return Array.isArray(v.events) ? v.events.filter((e) => valid(e) && e.id) : [];
  }

  function loadLeaves() {
    const v = read();
    return Array.isArray(v.leaves) ? v.leaves.filter(isDate) : [];
  }

  function save(events, leaves = loadLeaves()) {
    storage.setItem(KEY, JSON.stringify({ version: 1, events, leaves }));
  }

  function listEvents(date) {
    const all = load();
    const list = date ? all.filter((e) => e.date === date) : all;
    return list.sort((a, b) => a.date.localeCompare(b.date) || sortKey(a).localeCompare(sortKey(b)));
  }

  function addEvent(input) {
    const e = normalize(input);
    if (!valid(e)) throw new Error("invalid event");
    const event = { id: newId(), ...e };
    save([...load(), event]);
    return event;
  }

  function updateEvent(input) {
    const e = { id: input.id, ...normalize(input) };
    if (!valid(e)) throw new Error("invalid event");
    save(load().map((x) => (x.id === e.id ? e : x)));
  }

  function deleteEvent(id) {
    save(load().filter((x) => x.id !== id));
  }

  function marksFor(date) {
    const kinds = new Set(load().filter((e) => e.date === date).map((e) => e.kind));
    return MARK_ORDER.filter((k) => kinds.has(k)).join("") + (kinds.has("他") ? "●" : "");
  }

  function isLeave(date) {
    return loadLeaves().includes(date);
  }

  function setLeave(date, on) {
    const rest = loadLeaves().filter((d) => d !== date);
    save(load(), on ? [...rest, date].sort() : rest);
  }

  function exportJSON() {
    return JSON.stringify({ version: 1, events: load(), leaves: loadLeaves() }, null, 1);
  }

  function importJSON(text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, reason: "ファイルを読み取れませんでした" };
    }
    if (!Array.isArray(data?.events) || !data.events.every((e) => valid(e) && e.id)) {
      return { ok: false, reason: "バックアップの形式が正しくありません" };
    }
    // Backups made before 年休 existed have no leaves list.
    const leaves = data.leaves ?? [];
    if (!Array.isArray(leaves) || !leaves.every(isDate)) {
      return { ok: false, reason: "バックアップの形式が正しくありません" };
    }
    save(data.events, leaves);
    return { ok: true, count: data.events.length };
  }

  return { listEvents, addEvent, updateEvent, deleteEvent, marksFor, isLeave, setLeave, exportJSON, importJSON };
}

let defaultStore;
export const store = () => (defaultStore ??= createStore(localStorage));
