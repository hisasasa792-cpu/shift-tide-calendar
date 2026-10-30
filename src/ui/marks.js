// Colour the 残・早 marks yellow so they stand out from 会 and ●.
export const marksHtml = (s) =>
  [...s].map((c) => (c === "残" || c === "早" ? `<span class="mk-y">${c}</span>` : c)).join("");
