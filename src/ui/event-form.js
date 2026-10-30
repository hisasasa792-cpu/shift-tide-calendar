import { store } from "../store.js";
import { esc } from "./esc.js";

const KINDS = [["残", "残"], ["早", "早"], ["会", "会"], ["他", "その他"]];

// Add (event undefined) or edit an event. 残/早 have no time or title: tapping them saves at once.
export function openEventForm(el, { date, event, onDone }) {
  let kind = event?.kind ?? null;

  function draw() {
    const timeless = kind === "残" || kind === "早";
    el.innerHTML = `
      <div class="form">
        <h3>${event ? "予定を編集" : "予定を追加"}</h3>
        <div class="kinds">${KINDS.map(([k, label]) =>
          `<button type="button" data-kind="${k}" aria-pressed="${k === kind}">${label}</button>`).join("")}</div>
        ${kind && !timeless ? `
          <label>時刻（任意）<input type="time" name="time" value="${esc(event?.time ?? "")}"></label>
          <label>内容${kind === "他" ? "" : "（任意）"}<input type="text" name="title" value="${esc(event?.title ?? "")}" placeholder="${kind === "会" ? "会議" : "髭脱毛"}"></label>` : ""}
        <p class="err"></p>
        <div class="actions">
          <button type="button" data-act="cancel">キャンセル</button>
          ${event ? `<button type="button" data-act="delete">削除</button>` : ""}
          ${kind && (!timeless || event) ? `<button type="button" class="primary" data-act="save">保存</button>` : ""}
        </div>
      </div>`;

    el.querySelectorAll("[data-kind]").forEach((b) => (b.onclick = () => {
      kind = b.dataset.kind;
      const quick = (kind === "残" || kind === "早") && !event;
      if (quick) {
        if (!store().listEvents(date).some((e) => e.kind === kind)) {
          store().addEvent({ date, kind, time: "", title: "" });
        }
        onDone();
      } else {
        draw();
      }
    }));
    el.querySelector('[data-act="cancel"]').onclick = onDone;
    const del = el.querySelector('[data-act="delete"]');
    if (del) del.onclick = () => { store().deleteEvent(event.id); onDone(); };
    const save = el.querySelector('[data-act="save"]');
    if (save) save.onclick = () => {
      const time = el.querySelector('[name="time"]')?.value ?? "";
      const title = el.querySelector('[name="title"]')?.value ?? "";
      if (kind === "他" && !title.trim()) {
        el.querySelector(".err").textContent = "内容を入力してください";
        return;
      }
      const data = { date, kind, time, title };
      if (event) store().updateEvent({ ...data, id: event.id });
      else store().addEvent(data);
      onDone();
    };
  }

  draw();
}
