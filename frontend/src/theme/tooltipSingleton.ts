/**
 * Single global window listener for all tooltip repositioning.
 * Debounced to avoid excessive layout work during scroll/resize bursts.
 */

const listeners = new Set<() => void>();
let attached = false;
let debounceTimer: number | null = null;

const DEBOUNCE_MS = 48;

function flush() {
  debounceTimer = null;
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore single listener errors */
    }
  });
}

function onWindowChange() {
  if (debounceTimer !== null) window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(flush, DEBOUNCE_MS);
}

export function subscribeTooltipReposition(listener: () => void): () => void {
  listeners.add(listener);
  if (!attached) {
    window.addEventListener("resize", onWindowChange, { passive: true });
    window.addEventListener("scroll", onWindowChange, { passive: true, capture: true });
    attached = true;
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("resize", onWindowChange);
      window.removeEventListener("scroll", onWindowChange, true);
      attached = false;
      if (debounceTimer !== null) {
        window.clearTimeout(debounceTimer);
        debounceTimer = null;
      }
    }
  };
}
