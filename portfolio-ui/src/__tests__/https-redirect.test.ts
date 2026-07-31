/**
 * Guards the plaintext-HTTP redirect decision.
 *
 * This logic exists because Cloudflare's zone-level "Always Use HTTPS" does not
 * fire for this Worker's custom-domain routes — verified 2026-07-31 from two
 * independent networks with the setting enabled. Nothing in this repo can
 * assert dashboard state, so the guarantee is pinned here.
 *
 * Scope note, so this is not mistaken for more coverage than it provides: these
 * tests cover the *decision*, not its position in worker.ts. That the redirect
 * runs ahead of the /api/chat branch — the property that keeps cleartext PII
 * away from the chat handler — is a structural guarantee enforced by code
 * review and the comment at that call site, not by this file. Asserting it here
 * would mean importing worker.ts, which drags Workers-only types into the DOM
 * tsconfig project and breaks `tsc -b` (see tsconfig.app.json's exclude).
 */
import { describe, expect, it } from "vitest";
import { httpsRedirectTarget } from "../https-redirect";

describe("httpsRedirectTarget", () => {
  it("upgrades a plain http URL to https", () => {
    expect(httpsRedirectTarget("http://thulanimaseko.co.za/")).toBe("https://thulanimaseko.co.za/");
  });

  it("preserves path and query", () => {
    expect(httpsRedirectTarget("http://thulanimaseko.co.za/blog/hello?utm=x&b=2")).toBe(
      "https://thulanimaseko.co.za/blog/hello?utm=x&b=2",
    );
  });

  it("drops an explicit :80 rather than emitting https://host:80", () => {
    expect(httpsRedirectTarget("http://thulanimaseko.co.za:80/")).toBe(
      "https://thulanimaseko.co.za/",
    );
  });

  it("redirects www as well as the apex", () => {
    expect(httpsRedirectTarget("http://www.thulanimaseko.co.za/")).toBe(
      "https://www.thulanimaseko.co.za/",
    );
  });

  it("redirects the chat endpoint — cleartext PII must never reach it", () => {
    expect(httpsRedirectTarget("http://thulanimaseko.co.za/api/chat")).toBe(
      "https://thulanimaseko.co.za/api/chat",
    );
  });

  it("leaves https traffic alone", () => {
    expect(httpsRedirectTarget("https://thulanimaseko.co.za/")).toBeNull();
  });

  it.each(["http://localhost:5173/", "http://localhost:8787/api/chat", "http://127.0.0.1:8787/"])(
    "does not redirect %s — wrangler dev serves plain http on loopback",
    (url) => {
      expect(httpsRedirectTarget(url)).toBeNull();
    },
  );

  it("does not redirect a host merely containing 'localhost'", () => {
    // Guards against a future refactor swapping the exact-Set check for a
    // substring match, which would hand an attacker-controlled hostname like
    // localhost.evil.com a free pass out of HTTPS enforcement.
    expect(httpsRedirectTarget("http://localhost.evil.com/")).toBe("https://localhost.evil.com/");
  });
});
