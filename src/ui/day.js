import { fromISO, toISO } from "../date.js";
import { shiftFor, SHIFT_HOURS } from "../shift.js";
import { tideName } from "../tide-name.js";
import { holidayName } from "../holiday.js";
import { tideFor } from "../tide-data.js";
import { getForecast, hoursForDate, windDirName, weatherName, level } from "../weather.js";
import { store } from "../store.js";
import { PORTS } from "../config.js";
import { openEventForm } from "./event-form.js";
import { esc } from "./esc.js";
import { marksHtml, shiftChip } from "./marks.js";

const WD = ["日", "月", "火", "水", "木", "金", "土"];
const PORT_KEY = "ui.port";

function selectedPort() {
  let id;
  try { id = localStorage.getItem(PORT_KEY); } catch { /* storage blocked */ }
  return PORTS.find((p) => p.id === id) ?? PORTS[0];
}

function tideSvg(hourly) {
  const min = Math.min(...hourly);
  const max = Math.max(...hourly);
  const y = (v) => 80 - ((v - min) / (max - min || 1)) * 70;
  const pts = hourly.map((v, i) => `${(i * 300) / 23},${y(v).toFixed(1)}`).join(" ");
  const ticks = [0, 6, 12, 18].map((h) =>
    `<text x="${(h * 300) / 23}" y="90" font-size="9" fill="currentColor" opacity=".6">${h}時</text>`).join("");
  return `<svg class="tide-svg" viewBox="0 0 300 92" preserveAspectRatio="none" aria-hidden="true">
    <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" vector-effect="non-scaling-stroke"/>${ticks}</svg>`;
}

async function fillTide(sec, date, port) {
  const t = await tideFor(date, port.station);
  if (!t) {
    sec.innerHTML = `<h3>潮</h3><p class="msg">潮位データなし</p>`;
    return;
  }
  const fmt = (list) => list.map(([time, cm]) => `${time}（${cm}cm）`).join(" / ") || "なし";
  sec.innerHTML = `<h3>潮（${port.name}付近）</h3>${tideSvg(t.hourly)}
    <div class="tide-times"><span>満潮 ${fmt(t.high)}</span><span>干潮 ${fmt(t.low)}</span></div>`;
}

function fetchedLabel(ms) {
  const d = new Date(ms);
  const hm = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  return toISO(d) === toISO(new Date()) ? hm : `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
}

// Open-Meteo can return null for some hours; show "-" rather than failing.
const num = (v, digits) => (v == null ? "-" : v.toFixed(digits));
const lv = (kind, v) => (level(kind, v) ? `lv${level(kind, v)}` : "");

function windCell(h) {
  if (h.windDir == null) return num(h.windSpeed, 1);
  return `<span class="arrow" style="transform:rotate(${h.windDir + 180}deg)">↑</span>${windDirName(h.windDir)} ${num(h.windSpeed, 1)}`;
}

export function wxTable(hours) {
  const rows = hours.map((h) => `<tr>
    <td>${Number(h.time.slice(11, 13))}時</td>
    <td class="wind ${lv("wind", h.windSpeed)}">${windCell(h)}</td>
    <td class="${lv("wind", h.gust)}">${num(h.gust, 0)}</td>
    <td>${h.code == null ? "-" : weatherName(h.code)}</td>
    <td class="${lv("precip", h.precip)}">${num(h.precip, 1)}</td>
    <td class="${lv("wave", h.wave)}">${num(h.wave, 1)}</td>
  </tr>`).join("");
  return `<div class="hscroll"><table class="wx"><thead><tr><th>時刻</th><th>風向・風速 m/s</th><th>最大</th><th>天気</th><th>雨mm</th><th>波m</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

async function fillWeather(sec, date, port, force = false) {
  sec.innerHTML = `<h3>風・天気・波（${port.name}）</h3><p class="msg">予報を取得しています…</p>`;
  const r = await getForecast(port, { force });
  const data = r.hours ? r : r.cached;
  let body;
  if (!data) {
    body = `<p class="warn">取得できませんでした</p>`;
  } else {
    const hours = hoursForDate(data.hours, date);
    body = `<div class="fetched"><span>${fetchedLabel(data.fetchedAt)} 取得の予報</span><button data-act="refresh">更新</button></div>
      ${r.error ? `<p class="warn">最新の予報を取得できませんでした</p>` : ""}
      ${hours.length ? wxTable(hours) : `<p class="msg">予報はまだありません</p>`}`;
  }
  sec.innerHTML = `<h3>風・天気・波（${port.name}）</h3>${body}`;
  const btn = sec.querySelector('[data-act="refresh"]');
  if (btn) btn.onclick = () => fillWeather(sec, date, port, true);
}

// Registered emoji plus any already on this day (even if since removed from the palette).
function fillStamps(sec, date) {
  const on = store().stampsFor(date);
  const list = [...store().palette(), ...on.filter((e) => !store().palette().includes(e))];
  sec.innerHTML = `<h3>絵文字<span class="count">2つまで</span></h3>
    ${list.length ? `<div class="pal">${list.map((e, i) =>
      `<button data-i="${i}" aria-pressed="${on.includes(e)}">${esc(e)}</button>`).join("")}</div>`
      : `<p class="msg">月の画面の「絵文字を登録」から登録できます</p>`}`;
  sec.querySelectorAll("[data-i]").forEach((b) => (b.onclick = () => {
    if (store().toggleStamp(date, list[Number(b.dataset.i)])) fillStamps(sec, date);
  }));
}

function fillEvents(sec, date, rerender) {
  const list = store().listEvents(date);
  const label = (e) => (e.kind === "残" ? "残業" : e.kind === "早" ? "早出" : e.title || "会議");
  sec.innerHTML = `<h3>予定</h3>
    ${list.length ? `<ul class="events">${list.map((e) => `<li data-id="${esc(e.id)}">
      <span class="k">${e.kind === "他" ? "●" : marksHtml(e.kind)}</span><span class="t">${esc(e.time)}</span><span>${esc(label(e))}</span></li>`).join("")}</ul>`
      : `<p class="msg">予定なし</p>`}
    <button class="add primary">＋ 予定を追加</button>`;
  const done = () => rerender();
  sec.querySelectorAll("li[data-id]").forEach((li) => (li.onclick = () => {
    const event = list.find((e) => e.id === li.dataset.id);
    openEventForm(sec, { date, event, onDone: done });
  }));
  sec.querySelector(".add").onclick = () => openEventForm(sec, { date, onDone: done });
}

export function renderDay(el, date, { crew, onBack }) {
  const s = shiftFor(date, crew);
  const leave = s !== "休" && store().isLeave(date);
  const kinds = new Set(store().listEvents(date).map((e) => e.kind));
  const duty = leave ? `年休（元は ${s} ${SHIFT_HOURS[s]}）` : SHIFT_HOURS[s];
  const d = fromISO(date);
  const port = selectedPort();
  el.innerHTML = `
    <div class="bar"><button class="nav" data-act="back" aria-label="月に戻る">‹</button><span></span></div>
    <div class="day">
      <h2>${d.getMonth() + 1}月${d.getDate()}日（${WD[d.getDay()]}）${holidayName(date) ? `<span class="hol">${holidayName(date)}</span>` : ""}${shiftChip(s, leave)}
        <span class="marks">${marksHtml(store().marksFor(date))}</span></h2>
      <div class="meta">勤務 ${duty} ・ ${tideName(date)}</div>
      <div class="quick">${[["残", "残"], ["早", "早"], ["会", "会"], ["他", "その他"]].map(([k, label]) =>
        `<button data-quick="${k}"${k === "残" || k === "早" ? ` aria-pressed="${kinds.has(k)}"` : ""}>${label}</button>`).join("")}</div>
      ${s === "休" ? "" : `<button class="leave" data-act="leave">${leave ? "年休を取り消す" : "年休にする"}</button>`}
      <section data-sec="stamps"></section>
      <section data-sec="events"></section>
      <div class="tabs" role="tablist">${PORTS.map((p) =>
        `<button role="tab" data-port="${p.id}" aria-selected="${p.id === port.id}">${p.name}</button>`).join("")}</div>
      <section data-sec="tide"></section>
      <section data-sec="wx"></section>
    </div>`;

  el.querySelector('[data-act="back"]').onclick = onBack;
  el.querySelectorAll("[data-port]").forEach((b) => (b.onclick = () => {
    try { localStorage.setItem(PORT_KEY, b.dataset.port); } catch { /* storage blocked */ }
    renderDay(el, date, { crew, onBack });
  }));
  const rerender = () => renderDay(el, date, { crew, onBack });
  const leaveBtn = el.querySelector('[data-act="leave"]');
  if (leaveBtn) leaveBtn.onclick = () => { store().setLeave(date, !leave); rerender(); };
  fillTide(el.querySelector('[data-sec="tide"]'), date, port);
  fillWeather(el.querySelector('[data-sec="wx"]'), date, port);
  // 残/早 toggle at once; 会/その他 open the form below with that type already chosen.
  const events = el.querySelector('[data-sec="events"]');
  el.querySelectorAll("[data-quick]").forEach((b) => (b.onclick = () => {
    const k = b.dataset.quick;
    if (k === "残" || k === "早") {
      const found = store().listEvents(date).find((e) => e.kind === k);
      if (found) store().deleteEvent(found.id);
      else store().addEvent({ date, kind: k });
      rerender();
    } else {
      openEventForm(events, { date, kind: k, onDone: rerender });
      events.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }));
  fillStamps(el.querySelector('[data-sec="stamps"]'), date);
  fillEvents(el.querySelector('[data-sec="events"]'), date, rerender);
}
