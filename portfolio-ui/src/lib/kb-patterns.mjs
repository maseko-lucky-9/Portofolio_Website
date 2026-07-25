/**
 * PII detection for the chatbot knowledge base. Shared, deliberately.
 *
 * ============================ WHY THIS FILE EXISTS ============================
 * The knowledge base is authored in Google Docs and ends up in two public places:
 * src/generated/knowledge.ts (committed to a PUBLIC repo, git history permanent)
 * and — once live sync is on — Workers KV, read out by an LLM to recruiters.
 *
 * The gate that was supposed to stop personal information reaching those places
 * did not work. Its SA-mobile pattern allowed a SPACE between digit groups but
 * not a HYPHEN:
 *
 *     /(?:\+27|\b0)\s?[6-8]\d(?:\s?\d){7}\b/
 *
 * The real CV writes the number hyphen-separated. Run against the actual 4,948-
 * char export, that pattern produced ZERO hits. Had `npm run kb:refresh` been run
 * as the setup guide instructs, a personal mobile number would have been
 * committed to a public repo permanently. Nothing downstream would have caught
 * it: gitleaks has no default rule for South African phone numbers.
 *
 * So this file is not a tidy-up. It is the control itself.
 * =============================================================================
 *
 * THREE CONSUMERS, and they must not drift:
 *   1. scripts/fetch-knowledge.mjs — author-time, exits non-zero on a hit
 *   2. src/kb.ts                   — the Worker's hourly sync, refuses to publish
 *   3. .gitleaks.toml              — CI backstop; hand-maintained because gitleaks
 *                                    uses Go RE2 (no lookarounds, and `\s` there
 *                                    excludes U+00A0, which JS `\s` matches).
 *                                    src/__tests__/kb-patterns.test.ts asserts all
 *                                    three block the same corpus.
 *
 * DESIGN: match loosely with a regex, then VALIDATE in JS. A bare `\d{13}` for an
 * ID number false-positives on invoice and transaction numbers; a Luhn check plus
 * a date-plausibility check does not. A false positive is not harmless here — it
 * silently freezes the sync, and under live sync nobody is watching.
 *
 * PERFORMANCE IS A CORRECTNESS CONCERN. The Worker's scheduled handler gets 10 ms
 * of CPU on the Workers Free plan. The obvious email pattern
 * /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/ backtracks quadratically and was measured
 * at 1,824 ms on a 40 KB input — 180x the budget. The handler would be killed
 * silently, at the same point, every hour, for ever. Every pattern below is
 * bounded or lookbehind-anchored to stay linear. There is a test asserting the
 * whole set runs in single-digit ms on pathological input; do not remove it.
 */

/**
 * Separator class shared by the numeric patterns. Google Docs applies smart
 * punctuation and preserves characters pasted from Word, so ASCII hyphen alone is
 * not enough: U+2010..U+2015 covers hyphen, non-breaking hyphen, figure dash, en
 * dash, em dash and horizontal bar. NBSP is handled by `normalise()` below rather
 * than here — folding is more reliable than enumerating codepoints, because there
 * is always another one (U+2212 MINUS SIGN defeats even this class).
 */
const SEP = "[\\s.\\u2010-\\u2015/-]?";

/**
 * Canonicalise before scanning. This is the robust half of the defence: it means
 * the patterns only ever see ASCII separators, whatever Google Docs emitted.
 *
 * NFKC folds full-width and compatibility forms; the explicit replaces handle the
 * dash and space families NFKC leaves alone (it does NOT normalise U+2013 to "-",
 * nor U+00A0 to " ").
 */
export function normalise(text) {
  return (
    text
      .normalize("NFKC")
      // U+2010..U+2015 (hyphen, non-breaking hyphen, figure/en/em dash, horizontal
      // bar) plus U+2212 MINUS SIGN. Escapes, not literals: as raw characters these
      // are invisible in a diff and indistinguishable from an ASCII hyphen.
      .replace(/[\u2010-\u2015\u2212]/g, "-")
      // NBSP, narrow NBSP, thin space — Google Docs emits these routinely.
      .replace(/[\u00A0\u202F\u2009]/g, " ")
  );
}

/** Digits only, with a leading +27 / 0027 / 0 trunk prefix removed. */
function nationalDigits(raw) {
  const d = raw.replace(/\(0\)/g, "").replace(/\D/g, "");
  if (d.startsWith("0027")) return d.slice(4);
  if (d.startsWith("27")) return d.slice(2);
  if (d.startsWith("0")) return d.slice(1);
  return d;
}

/** Luhn, used to separate real SA ID numbers from any other run of 13 digits. */
function luhnOk(digits) {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/** YYMMDD prefix of an SA ID must be a real date. */
function plausibleIdDate(digits) {
  const mm = Number(digits.slice(2, 4));
  const dd = Number(digits.slice(4, 6));
  return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31;
}

/**
 * Each rule is { name, re, valid? }. `re` finds candidates (global); `valid`
 * optionally confirms one. A rule fires only if some candidate passes `valid`.
 */
const RULES = [
  {
    name: "SA ID number",
    // 13 digits, any separator. Deliberately loose — `valid` does the real work.
    re: new RegExp(`(?<![\\d-])(?:\\d${SEP}){12}\\d(?![\\d-])`, "g"),
    valid: (m) => {
      const d = m.replace(/\D/g, "");
      return d.length === 13 && plausibleIdDate(d) && luhnOk(d);
    },
  },
  {
    name: "SA phone number",
    // ALL area codes, not just [6-8] mobile — landlines (011/012/021/031/041…)
    // are just as identifying and the old pattern ignored them entirely.
    re: new RegExp(
      `(?<![\\d\\w.-])(?:\\+27|0027|0)${SEP}(?:\\(0\\)${SEP})?(?:\\d${SEP}){8}\\d(?![\\d-])`,
      "g",
    ),
    // 9 national digits, first in 1-8. Rejects version strings and long IDs.
    valid: (m) => {
      const d = nationalDigits(m);
      return d.length === 9 && /^[1-8]/.test(d);
    },
  },
  {
    name: "email address",
    // Bounded quantifiers + lookbehind keep this LINEAR. See the header note:
    // the naive form is 180x over the Worker's CPU budget on a 40 KB input.
    // Catches referee contact details, which are third-party personal
    // information — the sharpest POPIA exposure in the whole feature.
    re: /(?<![a-z0-9._%+-])[a-z0-9._%+-]{1,64}@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.){1,4}[a-z]{2,24}\b/gi,
    // The owner's own address is the contact route the bot is told to hand out.
    valid: (m) => m.toLowerCase() !== "ltmaseko7@gmail.com",
  },
  {
    name: "identity field label",
    // TWO branches on purpose. The original wrapped every alternative in one
    // group ending in \b, so a colon-terminated label could never match: there
    // is no word boundary between ":" and " ". Anything terminated by a colon
    // rather than a word character goes in the second branch.
    re: /\b(?:id\s*(?:no\.?|nr\.?|number)|identity\s*(?:no\.?|number)|date\s*of\s*birth|marital\s*status|nationality|citizenship|home\s*address|residential\s*address|postal\s*address|physical\s*address|next[\s-]*of[\s-]*kin|ethnicity|population\s*group|employment\s*equity|home\s*language|driver'?s?\s*licen[cs]e|passport\s*(?:no\.?|number)|tax\s*(?:no\.?|number|reference)|medical\s*aid)\b|\b(?:gender|sex|race|religion|disability|dob)\s*[:=]/gi,
  },
  {
    name: "street address",
    re: /\b\d{1,5}[a-z]?\s+(?:[A-Z][A-Za-z'’-]+\s+){1,3}(?:street|str\.?|road|rd\.?|avenue|ave\.?|drive|lane|close|crescent|boulevard|blvd\.?|way|place)\b/gi,
  },
  {
    name: "unlabelled date of birth",
    // Year window 1940–2010 so release dates and project timelines don't trip it.
    re: /\b(?:19[4-9]\d|200\d|2010)[-/](?:0[1-9]|1[0-2])[-/](?:0[1-9]|[12]\d|3[01])\b/g,
  },
];

/**
 * Returns the names of the PII categories found, or [] if clean.
 * Pure — callers decide whether to exit, refuse to publish, or warn.
 */
export function findPii(text) {
  const src = normalise(text);
  const hits = [];
  for (const { name, re, valid } of RULES) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src)) !== null) {
      if (!valid || valid(m[0])) {
        hits.push(name);
        break;
      }
      // Zero-length guard: every pattern here consumes, but a future edit might not.
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }
  return hits;
}

/** Rule names, for the cross-consumer drift test. */
export const PII_RULE_NAMES = RULES.map((r) => r.name);

/**
 * Google Docs markdown export escapes angle brackets and leaves image
 * placeholders. Normalises separators too, so what is scanned is what is stored.
 */
export function tidy(md) {
  return normalise(md)
    .replace(/\\([<>[\]])/g, "$1")
    .replace(/^\s*\[image\d*\]\s*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
