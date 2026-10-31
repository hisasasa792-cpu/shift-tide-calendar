// Personal events, 年休 (annual leave) days and emoji stamps, kept in localStorage. kind: 残 / 早 / 会 / 他.

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

// Emoji the user can stamp on a day (editable on the 絵文字 screen); at most MAX_STAMPS per day.
export const DEFAULT_PALETTE = ["🎣", "🎃", "⚽", "🎳", "⛳", "🎰", "🛒"];
const MAX_STAMPS = 2;
const isEmoji = (s) => typeof s === "string" && s.trim() !== "" && s.length <= 16;
const validPalette = (p) => Array.isArray(p) && p.every(isEmoji);
const validStamps = (o) => o && typeof o === "object" && !Array.isArray(o)
  && Object.entries(o).every(([d, l]) => isDate(d) && Array.isArray(l) && l.length <= MAX_STAMPS && l.every(isEmoji));

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

  function loadStamps() {
    const v = read();
    return validStamps(v.stamps) ? v.stamps : {};
  }

  // A missing palette means "never edited", so it starts with the defaults; an emptied one stays empty.
  function palette() {
    const v = read();
    return validPalette(v.palette) ? v.palette : [...DEFAULT_PALETTE];
  }

  // Writes the given parts and keeps the rest as stored.
  function save(parts) {
    const all = { events: load(), leaves: loadLeaves(), stamps: loadStamps(), palette: palette(), ...parts };
    storage.setItem(KEY, JSON.stringify({ version: 1, ...all }));
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
    save({ events: [...load(), event] });
    return event;
  }

  function updateEvent(input) {
    const e = { id: input.id, ...normalize(input) };
    if (!valid(e)) throw new Error("invalid event");
    save({ events: load().map((x) => (x.id === e.id ? e : x)) });
  }

  function deleteEvent(id) {
    save({ events: load().filter((x) => x.id !== id) });
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
    save({ leaves: on ? [...rest, date].sort() : rest });
  }

  function addToPalette(emoji) {
    const e = String(emoji).trim();
    if (!isEmoji(e) || palette().includes(e)) return false;
    save({ palette: [...palette(), e] });
    return true;
  }

  function removeFromPalette(emoji) {
    save({ palette: palette().filter((e) => e !== emoji) });
  }

  function stampsFor(date) {
    return loadStamps()[date] ?? [];
  }

  // Adds or removes one emoji on a day; returns false when the day already has the maximum.
  function toggleStamp(date, emoji) {
    const all = loadStamps();
    const cur = all[date] ?? [];
    let next;
    if (cur.includes(emoji)) next = cur.filter((e) => e !== emoji);
    else if (cur.length >= MAX_STAMPS) return false;
    else next = [...cur, emoji];
    const rest = { ...all };
    delete rest[date];
    save({ stamps: next.length ? { ...rest, [date]: next } : rest });
    return true;
  }

  function exportJSON() {
    const all = { events: load(), leaves: loadLeaves(), stamps: loadStamps(), palette: palette() };
    return JSON.stringify({ version: 1, ...all }, null, 1);
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
    // Older backups have no leaves / stamps / palette.
    const leaves = data.leaves ?? [];
    const stamps = data.stamps ?? {};
    const pal = data.palette ?? [...DEFAULT_PALETTE];
    if (!Array.isArray(leaves) || !leaves.every(isDate) || !validStamps(stamps) || !validPalette(pal)) {
      return { ok: false, reason: "バックアップの形式が正しくありません" };
    }
    save({ events: data.events, leaves, stamps, palette: pal });
    return { ok: true, count: data.events.length };
  }

  return {
    listEvents, addEvent, updateEvent, deleteEvent, marksFor, isLeave, setLeave,
    palette, addToPalette, removeFromPalette, stampsFor, toggleStamp, exportJSON, importJSON,
  };
}

let defaultStore;
export const store = () => (defaultStore ??= createStore(localStorage));
