import { fromISO, toISO } from "../date.js";
import { shiftFor, SHIFT_HOURS } from "../shift.js";
import { tideName } from "../tide-name.js";
import { tideFor } from "../tide-data.js";
import { getForecast, hoursForDate, windDirName, weatherName, level } from "../weather.js";
import { store } from "../store.js";
import { PORTS } from "../config.js";
import { openEventForm } from "./event-form.js";
import { esc } from "./esc.js";

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
  return `<table class="wx"><thead><tr><th>時刻</th><th>風向・風速 m/s</th><th>最大</th><th>天気</th><th>雨mm</th><th>波m</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
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

function fillEvents(sec, date, rerender) {
  const list = store().listEvents(date);
  const label = (e) => (e.kind === "残" ? "残業" : e.kind === "早" ? "早出" : e.title || "会議");
  sec.innerHTML = `<h3>予定</h3>
    ${list.length ? `<ul class="events">${list.map((e) => `<li data-id="${esc(e.id)}">
      <span class="k">${e.kind === "他" ? "●" : e.kind}</span><span class="t">${esc(e.time)}</span><span>${esc(label(e))}</span></li>`).join("")}</ul>`
      : `<p class="msg">予定なし</p>`}
    <button class="add primary">＋ 予定を追加</button>`;
  const done = () => rerender();
  sec.querySelectorAll("li[data-id]").forEach((li) => (li.onclick = () => {
    const event = list.find((e) => e.id === li.dataset.id);
    openEventForm(sec, { date, event, onDone: done });
  }));
  sec.querySelector(".add").onclick = () => openEventForm(sec, { date, onDone: done });
}

export function renderDay(el, date, { onBack }) {
  const s = shiftFor(date);
  const d = fromISO(date);
  const port = selectedPort();
  el.innerHTML = `
    <div class="bar"><button class="nav" data-act="back" aria-label="月に戻る">‹</button><span></span></div>
    <div class="day">
      <h2>${d.getMonth() + 1}月${d.getDate()}日（${WD[d.getDay()]}）<span class="chip s-${s}">${s}</span>
        <span class="marks">${store().marksFor(date)}</span></h2>
      <div class="meta">勤務 ${SHIFT_HOURS[s]} ・ ${tideName(date)}</div>
      <div class="tabs" role="tablist">${PORTS.map((p) =>
        `<button role="tab" data-port="${p.id}" aria-selected="${p.id === port.id}">${p.name}</button>`).join("")}</div>
      <section data-sec="tide"></section>
      <section data-sec="wx"></section>
      <section data-sec="events"></section>
    </div>`;

  el.querySelector('[data-act="back"]').onclick = onBack;
  el.querySelectorAll("[data-port]").forEach((b) => (b.onclick = () => {
    try { localStorage.setItem(PORT_KEY, b.dataset.port); } catch { /* storage blocked */ }
    renderDay(el, date, { onBack });
  }));
  const rerender = () => renderDay(el, date, { onBack });
  fillTide(el.querySelector('[data-sec="tide"]'), date, port);
  fillWeather(el.querySelector('[data-sec="wx"]'), date, port);
  fillEvents(el.querySelector('[data-sec="events"]'), date, rerender);
}
