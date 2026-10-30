import { monthGrid, toISO, weekday } from "../date.js";
import { shiftFor } from "../shift.js";
import { tideName } from "../tide-name.js";
import { store } from "../store.js";
import { CREW, KAIKYO_URL } from "../config.js";
import { exportBackup } from "./backup.js";
import { marksHtml } from "./marks.js";

const WD = ["日", "月", "火", "水", "木", "金", "土"];
const cls = (w) => (w === 0 ? "sun" : w === 6 ? "sat" : "");

function cell(date, today) {
  if (!date) return `<div class="cell empty"></div>`;
  const s = shiftFor(date);
  return `<div class="cell ${cls(weekday(date))}${date === today ? " today" : ""}" data-date="${date}">
    <div class="top"><span class="d">${Number(date.slice(8))}</span><span class="marks">${marksHtml(store().marksFor(date))}</span></div>
    <span class="chip s-${s}">${s}</span>
    <div class="tide">${tideName(date)}</div>
  </div>`;
}

export function renderMonth(el, year, month1, { onSelect, onMove }) {
  const today = toISO(new Date());
  el.innerHTML = `
    <div class="bar">
      <button class="nav" data-move="-1" aria-label="前の月">‹</button>
      <h1>${year}年${month1}月<span class="crew">${CREW}組</span></h1>
      <button class="nav" data-move="1" aria-label="次の月">›</button>
    </div>
    <div class="grid">${WD.map((w, i) => `<div class="wd ${cls(i)}">${w}</div>`).join("")}</div>
    <div class="grid">${monthGrid(year, month1).map((d) => cell(d, today)).join("")}</div>
    <div class="links">
      <a class="linkbtn" href="${KAIKYO_URL}" target="_blank" rel="noopener">水温・黒潮（関東・東海海況速報）</a>
      <div class="row">
        <button data-act="export">バックアップを書き出す</button>
        <button data-act="import">バックアップを読み込む</button>
      </div>
      <input type="file" accept="application/json,.json" hidden>
    </div>`;

  el.querySelectorAll("[data-move]").forEach((b) => (b.onclick = () => onMove(Number(b.dataset.move))));
  el.querySelectorAll(".cell[data-date]").forEach((c) => (c.onclick = () => onSelect(c.dataset.date)));

  el.querySelector('[data-act="export"]').onclick = () =>
    exportBackup(store().exportJSON(), `schedule-backup-${today}.json`);

  const file = el.querySelector('input[type="file"]');
  el.querySelector('[data-act="import"]').onclick = () => file.click();
  file.onchange = async () => {
    const f = file.files[0];
    if (!f) return;
    if (!confirm("今の予定をすべて、バックアップの内容に置き換えます。よろしいですか？")) return;
    const r = store().importJSON(await f.text());
    alert(r.ok ? `${r.count}件の予定を読み込みました` : r.reason);
    if (r.ok) renderMonth(el, year, month1, { onSelect, onMove });
  };
}
