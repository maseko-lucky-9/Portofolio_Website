/**
 * Plaintext-HTTP redirect decision for the Worker.
 *
 * Cloudflare's zone-level "Always Use HTTPS" does not fire for this Worker's
 * custom-domain routes — verified 2026-07-31 from two independent networks
 * with the setting enabled: http://thulanimaseko.co.za/ returned HTTP 200 with
 * real app content and no Location header. Nothing in this repo can assert
 * dashboard state, so the guarantee lives here instead, in version control and
 * under test.
 *
 * Kept as a standalone pure function rather than inlined in worker.ts because
 * worker.ts uses Workers-only types (ExportedHandler, ScheduledController) and
 * is deliberately excluded from tsconfig.app.json. A test importing worker.ts
 * would drag those types into the DOM project and break `tsc -b`. This module
 * uses only URL/string/Set, so it compiles cleanly under both projects — the
 * same arrangement chat.ts and kb.ts already rely on.
 */

// `wrangler dev` serves over plain http on loopback — never redirect there, or
// local development breaks.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

/**
 * Returns the https URL a plaintext request should be sent to, or null when the
 * request should be handled normally.
 */
export function httpsRedirectTarget(rawUrl: string): string | null {
  const url = new URL(rawUrl);

  if (url.protocol !== "http:") return null;
  if (LOCAL_HOSTS.has(url.hostname)) return null;

  url.protocol = "https:";
  // Without this, an explicit :80 survives the protocol swap and yields
  // https://host:80/ — technically valid, pointlessly ugly, and a needless
  // extra hop for anything that normalises it.
  url.port = "";

  return url.toString();
}
