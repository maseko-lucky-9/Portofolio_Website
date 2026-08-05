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
 *
 * Known gap: `useShouldRenderSmoothScroll` (motion.ts) also disables Lenis on
 * slow connections and `?lite=1`/`?nomo=1`, which this gate does not check. A
 * fine-pointer user in one of those states gets neither Lenis nor the
 * instant+hold correction — just plain smooth scrollIntoView, i.e. the drift
 * described above. Narrow (Chromium-only network-info API, several conditions
 * at once) and left as-is rather than duplicating that hook's logic here; fold
 * both onto a shared predicate if it ever bites.
 */

// Re-assert at most this many times, ~50ms apart: long enough to outlast a lazy
// chunk's import() and mount, short enough never to feel like a second scroll.
const MAX_SETTLE_TRIES = 20;
const SETTLE_INTERVAL_MS = 50;

// Only one hold loop may be live at a time. Without this, a loop keeps forcing
// the view back to *its* target for up to a second — fighting the user the
// moment they scroll themselves, and fighting a second nav tap started inside
// that window. Bumping the token invalidates whatever was running.
let activeRun = 0;

export function scrollToSection(target: string | Element | null | undefined): void {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;

  const instant =
    window.matchMedia?.("(pointer: coarse)")?.matches ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  // Supersede any in-flight hold loop, on both paths — a smooth scroll
  // started while one is running must not be yanked back either.
  const run = ++activeRun;

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

  // The user touching the screen wins immediately — correcting under their
  // finger would feel like the page fighting back.
  const yield_ = () => {
    if (activeRun === run) activeRun += 1;
  };
  const stopListening = () => {
    window.removeEventListener("wheel", yield_);
    window.removeEventListener("touchstart", yield_);
  };
  window.addEventListener("wheel", yield_, { once: true, passive: true });
  window.addEventListener("touchstart", yield_, { once: true, passive: true });

  const hold = () => {
    // Superseded by a newer navigation, or the user took over.
    if (activeRun !== run) {
      stopListening();
      return;
    }
    if (Math.abs(el.getBoundingClientRect().top - landingTop) > 2) {
      el.scrollIntoView({ behavior: "instant", block: "start" });
    }
    tries += 1;
    if (tries < MAX_SETTLE_TRIES) {
      window.setTimeout(hold, SETTLE_INTERVAL_MS);
    } else {
      stopListening();
    }
  };
  window.setTimeout(hold, SETTLE_INTERVAL_MS);
}
