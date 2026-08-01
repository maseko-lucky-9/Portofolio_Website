/**
 * Guards the PII gate — the control that decides whether personal information
 * reaches a PUBLIC git repo and an LLM that reads it out to recruiters.
 *
 * This suite exists because the previous gate did not work. Its SA-mobile pattern
 * allowed a space but not a hyphen between digit groups, and the real source CV
 * writes the number hyphenated, so the pattern produced zero hits on the actual
 * document. There were no tests, so nothing said so.
 *
 * ############################################################################
 * # EVERY FIXTURE BELOW IS SYNTHETIC. This file is in a public repo.         #
 * # Never paste a real phone number, ID number or address in here to "test   #
 * # it properly" — the patterns are format-driven, so 060-000-0000 exercises #
 * # exactly the same code path as a real number, and gitleaks has no rule    #
 * # that would catch the real one on its way in.                             #
 * ############################################################################
 *
 * Runs under the project default (jsdom); the module is pure but setupFiles runs
 * regardless of environment and touches `window`. Do not name the node-environment
 * pragma in this docblock — vitest parses the leading comment and acts on a mention
 * of it even in prose.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { findPii, normalise, tidy } from "../lib/kb-patterns.mjs";
import { BRIEF_MD, CV_MD } from "../generated/knowledge";

/** Luhn-valid, YYMMDD-plausible, and not anyone's: 900101 5800 08 8. */
const FAKE_ID = "9001015800088";
/** 060 is a real SA mobile prefix, so the shape is right; the subscriber part is not a number. */
const FAKE_MOBILE = "0600000000";

describe("findPii — must catch", () => {
  // The hyphen case is the regression that motivated this file.
  it.each([
    ["hyphen-separated mobile", "Call me on 060-000-0000"],
    ["space-separated mobile", "Call me on 060 000 0000"],
    ["unseparated mobile", `Call me on ${FAKE_MOBILE}`],
    ["dot-separated mobile", "Call me on 060.000.0000"],
    ["international +27", "Call me on +27 60 000 0000"],
    ["international with (0)", "Call me on +27(0)60 000 0000"],
    ["00-prefixed international", "Call me on 0027 60 000 0000"],
    ["Johannesburg landline", "Office: 011 234 5678"],
    ["Cape Town landline", "Office: 021-555-1234"],
  ])("%s", (_label, input) => {
    expect(findPii(input)).toContain("SA phone number");
  });

  // Google Docs applies smart punctuation and preserves characters pasted from
  // Word. A number that survived the gate because of the dash codepoint would be
  // indistinguishable from one that was never checked.
  it.each([
    ["non-breaking hyphen U+2011", "060‑000‑0000"],
    ["en dash U+2013", "060–000–0000"],
    ["em dash U+2014", "060—000—0000"],
    ["minus sign U+2212", "060−000−0000"],
    ["non-breaking space U+00A0", "060 000 0000"],
  ])("unicode separator: %s", (_label, input) => {
    expect(findPii(input)).toContain("SA phone number");
  });

  it.each([
    ["bare", FAKE_ID],
    ["space-grouped", "900101 5800 08 8"],
    ["hyphen-grouped", "900101-5800-088"],
  ])("SA ID number, %s", (_label, input) => {
    expect(findPii(input)).toContain("SA ID number");
  });

  // Referee details are third-party personal information — the sharpest POPIA
  // exposure here, because consent cannot be given on someone else's behalf.
  it("a third-party email address", () => {
    expect(findPii("Referee: Jane Doe, jane.doe@example.co.za")).toContain("email address");
  });

  it.each([
    ["word-terminated label", "Nationality: South African"],
    ["colon-terminated label", "Gender: Male"],
    ["ID label", "Identity Number 1234567890123"],
    ["next of kin", "Next of Kin: someone"],
  ])("identity field label, %s", (_label, input) => {
    expect(findPii(input)).toContain("identity field label");
  });

  it("a street address", () => {
    expect(findPii("12 Church Street, Sandton")).toContain("street address");
  });

  it("an unlabelled date of birth", () => {
    expect(findPii("Born 1993-04-12")).toContain("unlabelled date of birth");
  });
});

describe("findPii — must NOT fire", () => {
  // A false positive is not harmless: under live sync it silently freezes the
  // knowledge base at its last-good value with nobody watching.
  it.each([
    ["employment date range", "2013 - 2016"],
    ["certification date", "Nov 2022"],
    ["current role", "June 2023 - Current"],
    ["school and matric year", "Kwazamokuhle Secondary School 2011"],
    ["the site's own contact address", "Email ltmaseko7@gmail.com"],
    ["a version string", "wrangler 4.114.0"],
    ["a stack line", "Postgres 16 + SQLAlchemy 2 async"],
    ["a latency figure", "p95 under 500 ms across 12 services"],
    ["an invoice-shaped number", "INV-2024-0000123456789"],
    ["a rate-limit config", "simple = { limit = 8, period = 60 }"],
    ["a repo URL", "https://github.com/maseko-lucky-9/k8s-ref"],
    ["an ISO deploy timestamp", "deployed 2026-07-25T14:00:00Z"],
  ])("%s", (_label, input) => {
    expect(findPii(input)).toEqual([]);
  });

  it("the committed knowledge base and site data stay clean", () => {
    // If this ever fails, PII has reached the repo — investigate before "fixing" it.
    //
    // knowledge.ts is checked via its exported VALUES, not its file text, because the
    // pipeline gates document content and the file's own header is a warning listing
    // the very field labels the gate looks for ("date of birth", "home address").
    // Scanning the file would fire on the safety notice — which is a real property of
    // a label-matching gate, and the reason Phase 4's drafts must say "South African
    // citizen" rather than "Nationality: South African".
    expect(findPii(CV_MD), "CV_MD must be free of PII").toEqual([]);
    expect(findPii(BRIEF_MD), "BRIEF_MD must be free of PII").toEqual([]);

    for (const f of ["src/data/personal.ts", "src/data/experience.ts", "src/data/projects.ts"]) {
      expect(findPii(readFileSync(f, "utf8")), `${f} must be free of PII`).toEqual([]);
    }
  });
});

describe("normalise / tidy", () => {
  it("folds unicode dashes and spaces to ASCII so patterns see canonical text", () => {
    expect(normalise("a–b‑c d")).toBe("a-b-c d");
  });

  it("unescapes Google Docs angle brackets and drops image placeholders", () => {
    expect(tidy("a \\<b\\> c\n[image1]\n\n\n\nd")).toBe("a <b> c\n\nd");
  });
});

describe("performance", () => {
  /**
   * The Worker's scheduled handler gets 10 ms of CPU on the Workers Free plan, and
   * the natural email pattern — /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/ — backtracks
   * quadratically: measured at 1,824 ms on a 40 KB input, 180x the budget. The
   * handler would be killed silently, at the same point, every hour, for ever, and
   * the only symptom would be a knowledge base that quietly stopped updating.
   *
   * Anyone adding a pattern must keep this green.
   */
  it.each([
    ["40k digits", "1".repeat(40_000)],
    ["dotted digits", "1.".repeat(20_000)],
    ["keyword then long run", "references " + "a".repeat(39_000)],
    ["at-sign heavy", "a@".repeat(20_000)],
  ])("scans 40 KB of %s well inside the CPU budget", (_label, input) => {
    const start = performance.now();
    findPii(input);
    expect(performance.now() - start).toBeLessThan(50);
  });
});

describe("gitleaks mirror", () => {
  /**
   * .gitleaks.toml is the third consumer of these rules and cannot import the
   * module — gitleaks runs Go RE2. Its copy is therefore maintained by hand, which
   * is exactly how the original defect survived: the mobile pattern there was
   * byte-identical to the broken one, so all three gates failed together.
   *
   * This translates the RE2 source to JS well enough to prove the rules still match
   * the corpus. It is an approximation (RE2 has no lookarounds and a different \s),
   * which is why the JS gate — not this one — is the control that must hold.
   */
  const toml = readFileSync("../.gitleaks.toml", "utf8");

  const ruleRegex = (id: string): RegExp => {
    const block = toml.split(/\[\[rules\]\]/).find((b) => b.includes(`id = "${id}"`));
    if (!block) throw new Error(`.gitleaks.toml has no rule with id "${id}"`);
    const raw = block.match(/regex = '''([\s\S]*?)'''/)?.[1];
    if (!raw) throw new Error(`rule "${id}" has no regex`);
    // RE2 \x{2010} -> JS \u{2010}; leading (?i) -> the i flag.
    const flags = raw.includes("(?i)") ? "iu" : "u";
    return new RegExp(
      raw.replace(/\(\?i\)/g, "").replace(/\\x\{([0-9a-fA-F]+)\}/g, "\\u{$1}"),
      flags,
    );
  };

  it.each([
    ["za-phone-number", "060-000-0000"],
    ["za-phone-number", "060 000 0000"],
    ["za-phone-number", "+27 60 000 0000"],
    ["za-phone-number", "011 234 5678"],
    ["za-id-number", FAKE_ID],
    ["za-identity-field", "Nationality: South African"],
    ["za-identity-field", "Gender: Male"],
  ])("%s still blocks %s", (id, sample) => {
    expect(ruleRegex(id).test(sample)).toBe(true);
  });

  it("keeps a rule for every numeric category the shared module detects", () => {
    for (const id of ["za-id-number", "za-phone-number", "za-identity-field"]) {
      expect(() => ruleRegex(id)).not.toThrow();
    }
  });
});
