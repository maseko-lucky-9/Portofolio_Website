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
import { httpsRedirectTarget } from "./https-redirect";
import { refreshKb } from "./kb";

interface Env extends ChatEnv {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}

/** Structural — see the note in chat.ts on why @cloudflare/workers-types is absent. */
interface ScheduledController {
  cron: string;
  scheduledTime: number;
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
  // Deliberately short and un-preloaded while thulanimaseko.co.za is being
  // onboarded. `preload` is itself the consent signal — hstspreload.org accepts
  // submissions from anyone once the header qualifies, and removal takes months
  // of browser-release cycles. `includeSubDomains` would bind every depth for
  // the full max-age, but Cloudflare Universal SSL's free wildcard only covers
  // the apex plus ONE level (`*.<apex>`) — a nested host like the
  // argocd.homelab.<apex> dashboard this repo already references (see
  // content/projects/homelab-kubernetes.md), or any subdomain left DNS-only
  // instead of proxied, would be unreachable with no bypass. Raise to
  // max-age=31536000 a week after the domain is confirmed stable; re-add
  // includeSubDomains only alongside a matching cert/proxy strategy for
  // every subdomain actually in use.
  "Strict-Transport-Security": "max-age=300",
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
    // HTTPS enforcement lives here, not in the dashboard — Cloudflare's
    // zone-level "Always Use HTTPS" does not fire for this Worker's
    // custom-domain routes (see src/https-redirect.ts for the evidence).
    //
    // Deliberately the FIRST statement in the handler, ahead of the /api/chat
    // branch below: a plaintext POST to the chat endpoint must be bounced, not
    // processed. src/chat.ts notes visitors volunteer names and phone numbers
    // there, so it must never be handled over cleartext. Reordering this below
    // the chat branch would silently reintroduce that exposure.
    const redirectTo = httpsRedirectTarget(req.url);
    if (redirectTo) return Response.redirect(redirectTo, 301);

    const url = new URL(req.url);

    // Handled before the ASSETS wrapper below, for three reasons: the SSE body must
    // pass through untouched (10 ms CPU limit — no per-chunk work), it must not
    // inherit the static-asset headers, and with
    // not_found_handling = "single-page-application" an un-intercepted POST would
    // otherwise return the index.html shell at HTTP 200.
    if (url.pathname === "/api/chat") return handleChat(req, env);

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

  /**
   * Cron Trigger — see [triggers] in wrangler.toml. Pulls the chatbot's knowledge
   * base from Google Docs into KV.
   *
   * Awaited directly rather than wrapped in ctx.waitUntil: the runtime already keeps
   * the invocation alive for the promise returned by scheduled(), and waitUntil is
   * only needed for work that is NOT awaited.
   *
   * Cron invokes this handler directly — it does not route through the asset router,
   * so `run_worker_first` in wrangler.toml is irrelevant here. (It does mean the
   * local `wrangler dev --test-scheduled` endpoint gets swallowed by the fetch
   * handler above and returns the SPA shell; test refreshKb directly instead.)
   */
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    await refreshKb(env);
  },
} satisfies ExportedHandler<Env>;
