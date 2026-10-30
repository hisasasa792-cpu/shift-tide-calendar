export const CREW = "A";

// First 乙 day of each crew's 20-day cycle (read from the paper roster).
export const ANCHORS = { A: "2026-11-20", B: "2026-11-05", C: "2026-11-10", D: "2026-11-15" };

// station: JMA tide table code used for this port (nearest station).
export const PORTS = [
  { id: "katsuura", name: "勝浦", lat: 35.146, lon: 140.318, station: "ZF" },
  { id: "kominato", name: "小湊", lat: 35.120, lon: 140.192, station: "ZF" },
  { id: "nishikawana", name: "西川名", lat: 34.988, lon: 139.832, station: "MR" },
  { id: "mera", name: "布良", lat: 34.917, lon: 139.829, station: "MR" },
];

// 神奈川県水産技術センター 関東・東海海況速報/広域 (always the latest map).
export const KAIKYO_URL = "https://www.sui-kanagawa.jp/Kaikyozu/KantoTokai/";

// [amber, red] thresholds: wind m/s, precipitation mm/h, wave height m.
export const WARN = { wind: [8, 10], precip: [5, 10], wave: [1.5, 2.0] };
