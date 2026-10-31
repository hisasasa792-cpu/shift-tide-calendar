import { store } from "../store.js";
import { esc } from "./esc.js";

// The 絵文字 screen: add or remove the emoji offered when stamping a day.
export function renderEmoji(el, { onBack }) {
  const list = store().palette();
  el.innerHTML = `
    <div class="bar"><button class="nav" data-act="back" aria-label="月に戻る">‹</button><h1>絵文字の登録</h1><span class="nav-space"></span></div>
    <div class="day">
      <section>
        <h3>登録した絵文字</h3>
        ${list.length ? `<div class="pal">${list.map((e, i) =>
          `<button data-i="${i}" aria-label="${esc(e)} を登録から外す">${esc(e)}<span class="del">×</span></button>`).join("")}</div>`
          : `<p class="msg">まだ登録がありません</p>`}
        <form class="addrow">
          <input name="emoji" placeholder="絵文字を入力" autocomplete="off">
          <button class="primary">追加</button>
        </form>
        <p class="err" aria-live="polite"></p>
        <p class="msg">× を押すと登録から外れます。日付に付けてある絵文字は消えません。</p>
      </section>
    </div>`;

  const rerender = () => renderEmoji(el, { onBack });
  el.querySelector('[data-act="back"]').onclick = onBack;
  el.querySelectorAll(".pal [data-i]").forEach((b) => (b.onclick = () => {
    store().removeFromPalette(list[Number(b.dataset.i)]);
    rerender();
  }));
  el.querySelector(".addrow").onsubmit = (ev) => {
    ev.preventDefault();
    const v = ev.target.emoji.value;
    if (store().addToPalette(v)) rerender();
    else el.querySelector(".err").textContent = v.trim() ? "すでに登録されています" : "絵文字を入力してください";
  };
}
