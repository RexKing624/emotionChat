// Close only when both the press and release occur on the backdrop.
const presses = new WeakMap();
function outside(event) {
  const dialog = event.currentTarget;
  const rect = dialog.getBoundingClientRect();
  return event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
}
export function backdropStart(event) { presses.set(event.currentTarget, outside(event)); }
export function backdropClose(event, blocked = false) {
  const dialog = event.currentTarget;
  if (!blocked && presses.get(dialog) && outside(event)) dialog.close();
  presses.delete(dialog);
}
