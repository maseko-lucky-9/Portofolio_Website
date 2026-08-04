/**
 * Anchor navigation.
 *
 * Two separate problems make a plain `scrollIntoView({behavior:"smooth"})` land
 * in the wrong place on this page:
 *
 * 1. Smooth scroll animates toward an offset computed at call time, and scroll
 *    anchoring is suppressed while it runs. Sections below the fold are
 *    LazySection placeholders with fixed pixel reserves (Index.tsx) that expand
 *    as the animation passes them, so the target drifts out from under the
 *    scroll — ~4,000px was measured for #services on a 390px viewport.
 *
 * 2. Even with an instant jump, LazySection mounts the sections just *above*
 *    the target (its observer has a 300px rootMargin) and those expand, pushing
 *    the target down. Chromium hides this with scroll anchoring; WebKit has
 *    none, so on iOS Safari the target ended up ~1,900px off.
 *
 * So: jump instantly (never traverses the intermediate sections), then re-assert
 * the position until it stops moving. The correction runs only where the smooth
 * path is already off — coarse pointers (Lenis is gated off there, see
 * useShouldRenderSmoothScroll) and reduced-motion. Fine-pointer users keep the
 * Lenis-smoothed path unchanged.
 *
 * The landing offset itself comes from `scroll-padding-top` on <html>.
 */

// Re-assert at most this many times, ~50ms apart: long enough to outlast a lazy
// chunk's import() and mount, short enough never to feel like a second scroll.
const MAX_SETTLE_TRIES = 20;
const SETTLE_INTERVAL_MS = 50;

export function scrollToSection(target: string | Element | null | undefined): void {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;

  const instant =
    window.matchMedia?.("(pointer: coarse)").matches ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  if (!instant) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  // First jump: lands correctly *and* brings the neighbouring lazy sections
  // into the observer's range so they start mounting.
  el.scrollIntoView({ behavior: "instant", block: "start" });

  // That first jump lands the target correctly, so its offset now *is* the
  // correct landing position (scroll-padding-top, ~80px). Hold it there while
  // the surrounding lazy sections mount: whenever the target drifts off that
  // reference, put it back. Converging on the correct offset rather than on
  // "stopped moving" is what matters — an earlier stability-based version
  // settled happily at 460px past the target.
  const landingTop = el.getBoundingClientRect().top;
  let tries = 0;
  const hold = () => {
    if (Math.abs(el.getBoundingClientRect().top - landingTop) > 2) {
      el.scrollIntoView({ behavior: "instant", block: "start" });
    }
    tries += 1;
    if (tries < MAX_SETTLE_TRIES) window.setTimeout(hold, SETTLE_INTERVAL_MS);
  };
  window.setTimeout(hold, SETTLE_INTERVAL_MS);
}
