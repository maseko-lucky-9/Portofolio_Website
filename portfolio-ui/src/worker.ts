/**
 * Cloudflare Worker entry — wraps the static-assets binding to inject
 * security + AI-opt-out headers on every response.
 *
 * Why a Worker script when static assets work standalone:
 *   The `[assets]`-only mode in wrangler.toml serves files raw. Custom
 *   response headers (HSTS, CSP, X-Robots-Tag noai, etc.) require a
 *   `main` script that asks the ASSETS binding for the file and then
 *   mutates the Response. Cloudflare Pages exposes a `_headers` file
 *   for this; Workers does not. See wrangler.toml.
 *
 * To enable: set the `main` field in wrangler.toml to this file.
 * The [assets] binding name `ASSETS` is the default.
 */

import { handleChat, type ChatEnv } from "./chat";

interface Env extends ChatEnv {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}

// CSP is intentionally permissive on initial rollout to avoid breaking
// the existing Plausible integration (index.html line ~139). Tighten to
// nonce-based in Phase 4 hardening.
const CSP = [
  "default-src 'self'",
  "script-src 'self' https://plausible.io 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://plausible.io https://api.indexnow.org",
  "media-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const PERMISSIONS_POLICY = [
  "accelerometer=()",
  "autoplay=()",
  "camera=()",
  "display-capture=()",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  "payment=()",
  "usb=()",
  "xr-spatial-tracking=()",
].join(", ");

const STATIC_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": PERMISSIONS_POLICY,
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-site",
};

function isHtml(res: Response): boolean {
  const ct = res.headers.get("content-type") ?? "";
  return ct.includes("text/html");
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // Handled before the ASSETS wrapper below, for three reasons: the SSE body must
    // pass through untouched (10 ms CPU limit — no per-chunk work), it must not
    // inherit the static-asset headers, and with
    // not_found_handling = "single-page-application" an un-intercepted POST would
    // otherwise return the index.html shell at HTTP 200.
    if (new URL(req.url).pathname === "/api/chat") return handleChat(req, env);

    const res = await env.ASSETS.fetch(req);

    // Clone so we can mutate headers (the original Response is immutable
    // once consumed downstream).
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(STATIC_HEADERS)) {
      headers.set(k, v);
    }

    if (isHtml(res)) {
      headers.set("Content-Security-Policy", CSP);
      // AI-training opt-out signal at the HTTP layer (complements the
      // <meta name="robots" content="noai, noimageai"> in index.html).
      headers.set("X-Robots-Tag", "index, follow, noai, noimageai");
    }

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  },
} satisfies ExportedHandler<Env>;
