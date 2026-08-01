/**
 * Knowledge-base sync: Google Docs -> Workers KV, on an hourly Cron Trigger.
 *
 * ======================= READ BEFORE CHANGING ANYTHING =======================
 * Until now the knowledge base was refreshed by hand: `npm run kb:refresh` ran on a
 * laptop, a PII gate exited non-zero on a hit, and a human read `git diff` before
 * committing. That path had FOUR independent controls, all keyed off git — PR review,
 * the human diff, `gitleaks dir` and `gitleaks git`.
 *
 * This file removes all four. A cron fires, content is fetched, and an LLM starts
 * reading it out to recruiters — no PR, no diff, no gitleaks, nobody watching. The
 * validation below is the ONLY thing between a Google Doc edit and publication.
 *
 * It is therefore written to fail closed, and the failure modes are not symmetric.
 * See `refreshKb` for the three-way split; the un-share trap in particular is easy
 * to reintroduce by "simplifying" the error handling.
 * =============================================================================
 */
import { findPii, tidy } from "./lib/kb-patterns.mjs";
import { CV_MD, BRIEF_MD } from "./generated/knowledge";

/** Structural types — this repo has no @cloudflare/workers-types, and `any` is a
 *  hard eslint error outside src/components/ui. */
export interface KvNamespace {
  get(key: string, options?: { type?: "text" | "json"; cacheTtl?: number }): Promise<unknown>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface KbEnv {
  KB?: KvNamespace;
  GDOC_CV_ID?: string;
  GDOC_BRIEF_ID?: string;
}

export type Kb = { cv: string; brief: string };

export const KB_KEY = "kb:v1";
export const KB_STATUS_KEY = "kb:status";

/**
 * Combined cap across both documents.
 *
 * A COST control, not a formatting one. Workers AI has no prompt caching, so the whole
 * system prompt is re-billed on every message; document length is multiplied by
 * traffic against a hard 10,000 neuron/day free-tier cap. Measured, at ~4 chars/token
 * on llama-3.1-8b-fp8-fast (4,119 in / 34,868 out per 1M tokens):
 *
 *     kb chars   neurons/msg   messages/day
 *       10,000       44.5           224     <- the drafted documents today
 *       14,000       48.6           205     <- this cap
 *       40,000       75.3           132
 *
 * The curve is shallow up to here and steep beyond it, which is the whole argument:
 * 14,000 leaves real editing headroom for ~10 messages/day, while an unbounded — or
 * 40,000-char — cap lets anyone with document edit access cut the bot's daily capacity
 * by 40% using innocuous filler that passes every other check.
 */
const MAX_KB_CHARS = 14_000;
/** Below this a document is empty, truncated, or an error page we failed to classify. */
const MIN_DOC_CHARS = 200;
/** Read cap applied to the RAW response, before tidy() — see fetchDoc. */
const MAX_RAW_BYTES = 200_000;
/** Cron runs hourly; a 5-minute edge cache keeps reads warm without adding real staleness. */
const KB_CACHE_TTL = 300;
/** Audit entries expire after 90 days. Hashes and lengths only — never content. */
const AUDIT_TTL = 90 * 24 * 60 * 60;

/** Compiled-in fallback. Empty until `npm run kb:refresh` is run and committed; the
 *  bot then answers from src/data alone, which is a valid, working state. */
export const FALLBACK_KB: Kb = { cv: CV_MD, brief: BRIEF_MD };

/** Why a fetch failed, which determines whether the cached copy is still trustworthy. */
type FetchOutcome =
  | { kind: "ok"; text: string }
  | { kind: "revoked"; reason: string } // owner action: doc unshared or deleted
  | { kind: "transient"; reason: string }; // network/5xx: say nothing, keep last-good

/**
 * Never logs or embeds the document id. A link-viewable id is a bearer capability for
 * that document, and `[observability] enabled = true` in wrangler.toml means anything
 * thrown or logged here is retained by Cloudflare.
 */
async function fetchDoc(id: string): Promise<FetchOutcome> {
  let res: Response;
  try {
    res = await fetch(`https://docs.google.com/document/d/${id}/export?format=md`, {
      redirect: "follow", // Google 307s to a googleusercontent host
    });
  } catch {
    return { kind: "transient", reason: "network error" };
  }

  if (res.status === 404 || res.status === 403) {
    return { kind: "revoked", reason: `HTTP ${res.status}` };
  }
  if (!res.ok) {
    return { kind: "transient", reason: `HTTP ${res.status}` };
  }

  const text = await res.text();

  // Raw-length check BEFORE tidy(). tidy() runs several regex passes over the whole
  // string, and the scheduled handler has 10 ms of CPU on the Workers Free plan. A
  // multi-megabyte document would exhaust the budget before any cap could reject it,
  // and the handler would be killed at the same point every hour — silently, with a
  // stale knowledge base as the only symptom.
  if (text.length > MAX_RAW_BYTES) {
    return { kind: "transient", reason: "response too large" };
  }

  // THE TRAP: a document that is not link-viewable does NOT 404. Google returns its
  // sign-in page with HTTP 200 and a normal content-type. Without this check the
  // bot's "authoritative CV" silently becomes a login form.
  if (/<!DOCTYPE|<html[\s>]/i.test(text.slice(0, 2000))) {
    return { kind: "revoked", reason: "sign-in page (document is not link-viewable)" };
  }

  return { kind: "ok", text };
}

/**
 * Pure. Returns a rejection reason, or null when the pair is safe to publish.
 * Exported so the rules can be tested without Cloudflare, KV, or a network.
 */
export function validateKb(cv: string, brief: string): string | null {
  if (cv.length < MIN_DOC_CHARS) return "CV document too short";
  if (cv.length + brief.length > MAX_KB_CHARS) {
    return `too long (${cv.length + brief.length} chars, max ${MAX_KB_CHARS})`;
  }

  const combined = `${cv}\n${brief}`;

  // Document text is interpolated into the system prompt after the rules, so it can
  // forge the CONTEXT terminator or impersonate a system turn. Rejecting is cheaper
  // and more reliable than hoping an 8B model resolves the conflict correctly.
  if (/^={5,}\s*$/m.test(combined)) return "contains a context-block terminator";
  if (/^\s*(?:system|rules?)\s*:/im.test(combined)) return "contains a system-turn marker";

  const hits = findPii(combined);
  if (hits.length > 0) return `personal information detected: ${hits.join(", ")}`;

  return null;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)]
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Status is written on every run so a silent freeze is diagnosable without tailing logs. */
async function writeStatus(kv: KvNamespace, status: Record<string, unknown>): Promise<void> {
  try {
    await kv.put(KB_STATUS_KEY, JSON.stringify({ ...status, at: new Date().toISOString() }));
  } catch {
    /* status is diagnostic only — never let it fail the run */
  }
}

/**
 * Cron entry point. Fetches, validates, publishes.
 *
 * THE THREE OUTCOMES ARE DELIBERATELY DIFFERENT. Collapsing them creates the
 * un-share trap:
 *
 *   Suppose PII the gate missed reaches KV at 03:17. At 09:00 the owner notices. The
 *   instinctive response to "my CV is leaking" is to REVOKE THE LINK SHARE. If a
 *   revoked document were treated like any other failure — "keep serving last-good" —
 *   then un-sharing the document would be the single action that makes the leak
 *   PERMANENT, by severing the only channel that could ever overwrite it.
 *
 * So: revocation PURGES. Losing the source is exactly when the cached copy stops
 * being trustworthy, and degrading to the compiled-in fallback (the bot simply knows
 * less) is always safer than serving content the owner has tried to withdraw.
 *
 *   revoked   -> delete KB. Treated as intentional withdrawal.
 *   transient -> keep last-good. A network blip must not wipe the knowledge base.
 *   rejected  -> keep last-good. The NEW content is worse; the old content was fine.
 */
export async function refreshKb(env: KbEnv): Promise<void> {
  const { KB, GDOC_CV_ID, GDOC_BRIEF_ID } = env;
  if (!KB || !GDOC_CV_ID || !GDOC_BRIEF_ID) {
    console.log("kb-refresh: skipped (KB binding or document ids not configured)");
    return;
  }

  const [cvRes, briefRes] = await Promise.all([fetchDoc(GDOC_CV_ID), fetchDoc(GDOC_BRIEF_ID)]);

  // Either document being withdrawn purges both: they are published as one record,
  // and half a knowledge base is not a state worth preserving.
  const revoked = [cvRes, briefRes].find((r) => r.kind === "revoked");
  if (revoked && revoked.kind === "revoked") {
    await KB.delete(KB_KEY);
    await writeStatus(KB, { ok: false, purged: true, reason: revoked.reason });
    console.log(`kb-refresh: PURGED — source revoked (${revoked.reason})`);
    return;
  }

  const transient = [cvRes, briefRes].find((r) => r.kind === "transient");
  if (transient && transient.kind === "transient") {
    await writeStatus(KB, { ok: false, reason: transient.reason });
    console.log(`kb-refresh: fetch failed (${transient.reason}) — keeping last-good`);
    return;
  }

  const cvRaw = (cvRes as { kind: "ok"; text: string }).text;
  const briefRaw = (briefRes as { kind: "ok"; text: string }).text;

  // Explicit kill switch, so revocation can be exercised without touching sharing
  // settings — and so it works even if the sign-in-page heuristic ever changes.
  if (cvRaw.trim() === "PURGE" || briefRaw.trim() === "PURGE") {
    await KB.delete(KB_KEY);
    await writeStatus(KB, { ok: false, purged: true, reason: "PURGE sentinel" });
    console.log("kb-refresh: PURGED — PURGE sentinel found in a source document");
    return;
  }

  const cv = tidy(cvRaw);
  const brief = tidy(briefRaw);

  const reason = validateKb(cv, brief);
  if (reason) {
    await writeStatus(KB, { ok: false, rejected: true, reason });
    // Reason only. NEVER the content — that is the whole point of rejecting it.
    console.log(`kb-refresh: REJECTED (${reason}) — keeping last-good`);
    return;
  }

  await KB.put(KB_KEY, JSON.stringify({ cv, brief }));

  // Append-only audit. A single mutable KV value cannot answer "what was published,
  // and between when and when?" — which `git log` answered for free on the old path,
  // and which POPIA s22 breach notification depends on. Hashes, never content.
  const [cvHash, briefHash] = await Promise.all([sha256(cv), sha256(brief)]);
  await KB.put(
    `kb:log:${new Date().toISOString()}`,
    JSON.stringify({ cvHash, briefHash, cvLen: cv.length, briefLen: brief.length }),
    { expirationTtl: AUDIT_TTL },
  );
  await writeStatus(KB, { ok: true, cvLen: cv.length, briefLen: brief.length, cvHash, briefHash });
  console.log(`kb-refresh: ok cv=${cv.length} brief=${brief.length}`);
}

/**
 * Request path. Returns the live knowledge base, or the compiled-in fallback.
 *
 * Degrades on ANY failure — missing binding, KV error, malformed JSON, absent key.
 * A KV hiccup must make the bot know less, never make it return an error: the
 * fallback is a perfectly good answer source, and a 503 is not.
 */
export async function readKb(env: KbEnv): Promise<Kb> {
  if (!env.KB) return FALLBACK_KB;
  try {
    const live = (await env.KB.get(KB_KEY, { type: "json", cacheTtl: KB_CACHE_TTL })) as
      Partial<Kb> | null | undefined;
    // `null` is the ordinary case on every fresh deploy, before the first cron run.
    if (live && typeof live.cv === "string" && typeof live.brief === "string") {
      if (live.cv || live.brief) return { cv: live.cv, brief: live.brief };
    }
  } catch {
    /* fall through to the compiled-in copy */
  }
  return FALLBACK_KB;
}
