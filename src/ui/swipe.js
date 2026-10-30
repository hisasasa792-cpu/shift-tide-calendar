// A sideways flick: at least 60px across and clearly more sideways than up/down.
// Returns 1 for a swipe to the left (go forward), -1 for a swipe to the right (go back), 0 otherwise.
export function swipeDir(dx, dy) {
  if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return 0;
  return dx < 0 ? 1 : -1;
}

// Calls onSwipe(1 or -1) when the user flicks sideways on el.
// Ignored while typing in a form, and inside parts that scroll sideways (the forecast table).
export function onSwipe(el, onSwipe) {
  let start = null;
  el.addEventListener("touchstart", (e) => {
    const t = e.target;
    const skip = e.touches.length > 1 || t.closest?.(".form, input, textarea, select, .hscroll");
    start = skip ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  el.addEventListener("touchend", (e) => {
    if (!start) return;
    const t = e.changedTouches[0];
    const dir = swipeDir(t.clientX - start.x, t.clientY - start.y);
    start = null;
    if (dir) onSwipe(dir);
  }, { passive: true });
}
