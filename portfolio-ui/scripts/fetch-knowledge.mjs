#!/usr/bin/env node
/**
 * Pulls the chatbot's knowledge base out of Google Docs and writes
 * src/generated/knowledge.ts (committed) + public/resume.pdf (committed).
 *
 * Run it by hand when the source documents change:
 *   npm run kb:refresh
 *
 * Deliberately NOT part of `npm run build`. wrangler.toml's [build] command re-runs
 * on every `wrangler deploy`, so a build-time network fetch would make deploys
 * non-reproducible and force the doc IDs into the Cloudflare dashboard build env.
 * Committing the generated file instead means deploys are hermetic and the exact
 * text the bot speaks from shows up in code review.
 *
 * Auth: none. The export endpoint is public for link-viewable documents. Keep the
 * IDs in a gitignored .env (or GitHub *secrets* — Actions *variables* are rendered
 * in plaintext, and workflow logs on a public repo are world-readable).
 */
import { writeFile, readFile, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import path from "node:path";

const execFileAsync = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const OUT_TS = path.join(here, "../src/generated/knowledge.ts");
const OUT_PDF = path.join(here, "../public/resume.pdf");

/**
 * Patterns that must never reach a public repo. Unlike a network failure (which is
 * survivable — we keep the committed file), a PII hit is a hard stop: exit non-zero
 * so CI and the developer both notice. South-African CV conventions are unusually
 * PII-dense, and under POPIA some of these are special personal information.
 */
const PII = [
  { name: "SA ID number", re: /\b\d{6}[ -]?\d{4}[ -]?[01]\d{2}\b/ },
  { name: "SA mobile number", re: /(?:\+27|\b0)\s?[6-8]\d(?:\s?\d){7}\b/ },
  {
    name: "identity field",
    re: /\b(id no\.?|identity number|date of birth|marital status|nationality|home address)\b/i,
  },
];

function scanForPii(label, text) {
  const hits = PII.filter((p) => p.re.test(text)).map((p) => p.name);
  if (hits.length > 0) {
    console.error(
      `\n✗ ${label} contains what looks like personal information: ${hits.join(", ")}.\n` +
        `  This repo is PUBLIC and git history is effectively permanent.\n` +
        `  Remove those fields from the source document, then re-run.\n`,
    );
    process.exit(1);
  }
}

/** Google issues a 307 to a googleusercontent host; redirect: "follow" handles it. */
async function exportDoc(id, format) {
  const res = await fetch(`https://docs.google.com/document/d/${id}/export?format=${format}`, {
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return format === "pdf" ? Buffer.from(await res.arrayBuffer()) : await res.text();
}

/** Google's markdown export escapes angle brackets and leaves image placeholders. */
function tidy(md) {
  return md
    .replace(/\\([<>[\]])/g, "$1")
    .replace(/^\s*\[image\d*\]\s*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function main() {
  const cvId = process.env.GDOC_CV_ID;
  const briefId = process.env.GDOC_BRIEF_ID;

  if (!cvId || !briefId) {
    console.warn(
      "⚠ GDOC_CV_ID / GDOC_BRIEF_ID not set — keeping the committed knowledge.ts.\n" +
        "  Set them in .env at the repo root, then re-run.",
    );
    return;
  }

  let cv, brief;
  try {
    // Never log the constructed URL: the doc ID is the only thing gating access.
    [cv, brief] = await Promise.all([exportDoc(cvId, "md"), exportDoc(briefId, "md")]);
  } catch (err) {
    console.warn(`⚠ Google Docs fetch failed (${err.message}) — keeping the committed file.`);
    return; // exit 0: a deploy must never depend on Google being reachable
  }

  cv = tidy(cv);
  brief = tidy(brief);
  scanForPii("The CV document", cv);
  scanForPii("The recruiter brief", brief);

  const header = await readFile(OUT_TS, "utf8").then((s) => s.slice(0, s.indexOf("export const")));

  // JSON.stringify, never a template literal. String.raw still interpolates ${} and
  // still terminates on a backtick — and a backtick cannot be escaped inside it.
  // Google Docs emits backticks routinely (inline code, fenced blocks), and one
  // would produce a knowledge.ts that breaks vite build, wrangler deploy's [build]
  // step, and the Dockerfile simultaneously.
  const body =
    `export const CV_MD = ${JSON.stringify(cv)};\n\n` +
    `export const BRIEF_MD = ${JSON.stringify(brief)};\n`;

  // Validate before overwriting: a corrupt write is not caught by the fetch-level
  // fallback above, because the fetch succeeded.
  const tmp = `${OUT_TS}.tmp.mjs`;
  await writeFile(tmp, body.replace(/^export const /gm, "export const "), "utf8");
  try {
    await import(`file://${tmp}?t=${Date.now()}`);
  } catch (err) {
    await rm(tmp, { force: true });
    console.error(`✗ Generated file is not valid JS (${err.message}) — aborting, nothing written.`);
    process.exit(1);
  }
  await rm(tmp, { force: true });
  await writeFile(OUT_TS, header + body, "utf8");
  console.log(`✓ knowledge.ts — CV ${cv.length} chars, brief ${brief.length} chars`);

  // The same export endpoint gives us the PDF, which fixes the Download Resume
  // button (personal.ts resumeUrl points at /resume.pdf, which did not exist —
  // not_found_handling = "single-page-application" meant it served the SPA shell).
  try {
    await writeFile(OUT_PDF, await exportDoc(cvId, "pdf"));
    // PDF Author/Creator survives Google Docs export and carries the account identity.
    await execFileAsync("exiftool", ["-all=", "-overwrite_original", OUT_PDF]);
    console.log("✓ public/resume.pdf (metadata stripped)");
  } catch (err) {
    console.warn(
      `⚠ resume.pdf step failed (${err.message}).\n` +
        `  If exiftool is missing: brew install exiftool. NOT committing an unstripped PDF.`,
    );
    await rm(OUT_PDF, { force: true });
  }
}

main();
