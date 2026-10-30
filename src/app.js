import { renderMonth } from "./ui/month.js";
import { renderDay } from "./ui/day.js";
import { toISO } from "./date.js";

const el = document.getElementById("app");

// Hash routes: #/2026-11 (month) or #/2026-11-18 (day), so the phone's back button works.
function parseHash() {
  const m = location.hash.match(/^#\/(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!m) {
    const t = toISO(new Date());
    return { year: Number(t.slice(0, 4)), month: Number(t.slice(5, 7)), date: null };
  }
  return { year: Number(m[1]), month: Number(m[2]), date: m[3] ? `${m[1]}-${m[2]}-${m[3]}` : null };
}

const monthHash = (y, m) => `#/${y}-${String(m).padStart(2, "0")}`;

function render() {
  const { year, month, date } = parseHash();
  if (date) {
    renderDay(el, date, {
      onBack: () => (history.length > 1 ? history.back() : (location.hash = monthHash(year, month))),
    });
    window.scrollTo(0, 0);
    return;
  }
  renderMonth(el, year, month, {
    onSelect: (date) => { location.hash = `#/${date}`; },
    onMove: (d) => {
      const n = new Date(year, month - 1 + d, 1);
      location.hash = monthHash(n.getFullYear(), n.getMonth() + 1);
    },
  });
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", render);
render();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
