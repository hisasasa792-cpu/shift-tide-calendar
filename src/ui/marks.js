// Colour the 残・早 marks yellow so they stand out from 会 and ●.
export const marksHtml = (s) =>
  [...s].map((c) => (c === "残" || c === "早" ? `<span class="mk-y">${c}</span>` : c)).join("");

// 年休 keeps the shift's background colour but shows red 年休 text; a 休 day can't be 年休.
export function shiftChip(s, leave) {
  return leave && s !== "休"
    ? `<span class="chip s-${s} nenkyu">年休</span>`
    : `<span class="chip s-${s}">${s}</span>`;
}
