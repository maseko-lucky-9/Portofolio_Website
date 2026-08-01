// Outbound-link, contact and download click tracking for Umami.
//
// Umami does NOT capture these on its own — the visitor is leaving the page, so
// nothing fires. Umami's documented workaround is a snippet that runs
// querySelectorAll('a') once at parse time and stamps data-umami-event on each
// link; that misses every link React renders afterwards, which on this site is
// most of them. So this uses event delegation instead, modelled on Plausible's
// open-source tracker/src/custom-events.js.
//
// Lives in public/ (not src/) because the generated /blog, /answers and /projects
// pages are plain static HTML that never loads the React bundle. It is a real ES
// module with a named export so outbound.test.ts imports THIS file — the tested
// code is the shipped code, with no build step and no hand-kept copy.
//
// Deliberately NOT ported from Plausible: its shouldInterceptNavigation /
// preventDefault machinery. That exists because Plausible needs the beacon to
// survive page unload; Umami's send() already uses fetch(..., {keepalive: true}).
// Copying it would hijack navigation for no benefit.

/** Protocols that take the visitor off the site despite having no host. */
const OFF_SITE_PROTOCOLS = new Set(["mailto:", "tel:", "sms:"]);

/** Same-origin files worth counting as a conversion rather than a pageview. */
const DOWNLOAD_EXTENSIONS = new Set(["pdf", "zip", "docx", "doc", "csv", "xlsx", "pptx"]);

const MIDDLE_MOUSE_BUTTON = 1;

/**
 * Does clicking this href take the visitor off the site?
 *
 * Compares `host`, not `hostname` — a different port is a different origin, and
 * conflating them would under-count. mailto:/tel:/sms: are reported as outbound
 * even though their host is the empty string: they are contact conversions, and
 * the empty host is exactly why Plausible's `link.host &&` guard drops them.
 *
 * @param {string} href        raw href, may be relative or protocol-relative
 * @param {string} currentHost location.host, i.e. hostname[:port]
 * @returns {boolean}
 */
export function isOutbound(href, currentHost) {
  if (typeof href !== "string" || href === "") return false;

  let url;
  try {
    url = new URL(href, `https://${currentHost}`);
  } catch {
    return false; // unparseable href — not our problem, and never a conversion
  }

  if (OFF_SITE_PROTOCOLS.has(url.protocol)) return true;

  // javascript:, blob:, data: etc. are in-page behaviour, not a departure.
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  return url.host !== currentHost;
}

/**
 * Same-origin download (CV, etc.). Separate from isOutbound because the host
 * check can never catch these — Plausible models downloads the same way, as a
 * file-extension match rather than an origin comparison.
 *
 * @returns {boolean}
 */
export function isDownload(href, currentHost) {
  if (typeof href !== "string" || href === "") return false;

  let url;
  try {
    url = new URL(href, `https://${currentHost}`);
  } catch {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const last = url.pathname.split("/").pop() || "";
  const dot = last.lastIndexOf(".");
  if (dot === -1) return false;

  return DOWNLOAD_EXTENSIONS.has(last.slice(dot + 1).toLowerCase());
}

/**
 * Decide what a click on `href` should report, if anything.
 * @returns {{name: string, url: string} | null}
 */
export function classify(href, currentHost) {
  if (isOutbound(href, currentHost)) return { name: "outbound-link-click", url: href };
  if (isDownload(href, currentHost)) return { name: "file-download", url: href };
  return null;
}

/** Walk up from the click target to the nearest anchor with an href. */
function closestLink(node) {
  while (node && node !== document) {
    if (node.tagName === "A" && node.getAttribute("href")) return node;
    node = node.parentNode;
  }
  return null;
}

function handleClick(event) {
  // auxclick covers middle-click ("open in new tab"); every other aux button
  // (back/forward/right) is not a navigation and must not be counted.
  if (event.type === "auxclick" && event.button !== MIDDLE_MOUSE_BUTTON) return;

  const link = closestLink(event.target);
  if (!link) return;

  const event_ = classify(link.getAttribute("href"), window.location.host);
  if (!event_) return;

  // The tracker is absent in `npm run dev`, in `npm run preview`, and whenever an
  // ad-blocker eats it. Without this guard every outbound click throws.
  if (typeof window.umami === "undefined") return;

  window.umami.track(event_.name, { url: event_.url });
}

// Guarded so importing this module under vitest/node is side-effect-free enough
// to test the pure functions above.
if (typeof document !== "undefined") {
  document.addEventListener("click", handleClick);
  document.addEventListener("auxclick", handleClick);
}
