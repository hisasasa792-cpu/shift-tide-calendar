import { monthGrid, toISO, weekday } from "../date.js";
import { shiftFor } from "../shift.js";
import { tideName } from "../tide-name.js";
import { holidayName } from "../holiday.js";
import { store } from "../store.js";
import { KAIKYO_URL } from "../config.js";
import { CREWS } from "../prefs.js";
import { shiftChip } from "./marks.js";
import { esc } from "./esc.js";
import { exportBackup } from "./backup.js";
import { marksHtml } from "./marks.js";

const WD = ["日", "月", "火", "水", "木", "金", "土"];
const cls = (w) => (w === 0 ? "sun" : w === 6 ? "sat" : "");

const opts = (values, selected, label) =>
  values.map((v) => `<option value="${v}"${v === selected ? " selected" : ""}>${label(v)}</option>`).join("");

function cell(date, today, crew) {
  if (!date) return `<div class="cell empty"></div>`;
  const s = shiftFor(date, crew);
  // Holidays get the Sunday red.
  return `<div class="cell ${holidayName(date) ? "sun" : cls(weekday(date))}${date === today ? " today" : ""}" data-date="${date}">
    <div class="top"><span class="d">${Number(date.slice(8))}</span><span class="marks">${marksHtml(store().marksFor(date))}</span></div>
    ${shiftChip(s, store().isLeave(date))}
    <div class="tide">${tideName(date)}</div>
    <div class="emo">${esc(store().stampsFor(date).join(""))}</div>
  </div>`;
}

export function renderMonth(el, year, month1, { crew, years, onSelect, onMove, onJump, onCrew, onEmoji }) {
  const today = toISO(new Date());
  const first = year === years[0] && month1 === 1;
  const last = year === years[years.length - 1] && month1 === 12;
  el.innerHTML = `
    <div class="bar">
      <button class="nav" data-move="-1" aria-label="前の月"${first ? " disabled" : ""}>‹</button>
      <div class="pick">
        <select data-pick="year" aria-label="年">${opts(years, year, (y) => `${y}年`)}</select>
        <select data-pick="month" aria-label="月">${opts([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], month1, (m) => `${m}月`)}</select>
        <select data-pick="crew" aria-label="組">${opts(CREWS, crew, (c) => `${c}組`)}</select>
      </div>
      <button class="nav" data-move="1" aria-label="次の月"${last ? " disabled" : ""}>›</button>
    </div>
    <div class="grid">${WD.map((w, i) => `<div class="wd ${cls(i)}">${w}</div>`).join("")}</div>
    <div class="grid">${monthGrid(year, month1).map((d) => cell(d, today, crew)).join("")}</div>
    <div class="links">
      <a class="linkbtn" href="${KAIKYO_URL}" target="_blank" rel="noopener">水温・黒潮（関東・東海海況速報）</a>
      <div class="row">
        <button data-act="export">バックアップを書き出す</button>
        <button data-act="import">バックアップを読み込む</button>
      </div>
      <button data-act="emoji">絵文字を登録</button>
      <input type="file" accept="application/json,.json" hidden>
    </div>`;

  el.querySelectorAll("[data-move]").forEach((b) => (b.onclick = () => onMove(Number(b.dataset.move))));
  const pick = (k) => el.querySelector(`[data-pick="${k}"]`);
  pick("year").onchange = pick("month").onchange = () => onJump(Number(pick("year").value), Number(pick("month").value));
  pick("crew").onchange = () => onCrew(pick("crew").value);
  el.querySelectorAll(".cell[data-date]").forEach((c) => (c.onclick = () => onSelect(c.dataset.date)));

  el.querySelector('[data-act="emoji"]').onclick = onEmoji;
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
    if (r.ok) renderMonth(el, year, month1, { crew, years, onSelect, onMove, onJump, onCrew, onEmoji });
  };
}
