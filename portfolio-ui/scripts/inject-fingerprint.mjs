#!/usr/bin/env node
// Embeds a per-build random fingerprint into dist/index.html so stolen
// content can be tied back to a known release.
//
// Two markers, both intentionally low-signal:
//   1. HTML comment `<!-- bfp:<hex> -->` near the closing </head>.
//   2. Unused CSS class `bfp-<hex>` on the root <div id="root">.
//
// Scrapers usually preserve both — comments survive plain-text scrapes,
// the class survives DOM-based scrapes. Either appearing on a third-party
// site is grounds for a DMCA takedown.
//
// Manifest is written OUTSIDE the repo at ~/.config/portfolio/fingerprints.log
// so it survives `git clean -fdx` but is still recoverable. For team-grade
// provenance, also mirror to a private R2 bucket or 1Password vault.
//
// Idempotent: re-running on the same dist/ replaces the previous markers
// rather than stacking.

import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const HTML = resolve(REPO_ROOT, 'dist/index.html');
const MANIFEST_DIR = join(homedir(), '.config', 'portfolio');
const MANIFEST = join(MANIFEST_DIR, 'fingerprints.log');

if (!existsSync(HTML)) {
  console.error('[inject-fingerprint] dist/index.html not found — run vite build first');
  process.exit(1);
}

const fingerprint = randomBytes(8).toString('hex'); // 16-char hex
const buildIso = new Date().toISOString();

let gitSha = 'unknown';
try {
  gitSha = execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  }).trim();
} catch {
  // Fingerprinting still works without git context (e.g., archive build).
}

const html = readFileSync(HTML, 'utf8');

// Strip previous markers (idempotency).
let next = html
  .replace(/\s*<!-- bfp:[a-f0-9]+ -->/g, '')
  .replace(/(<div id="root")\s+class="bfp-[a-f0-9]+"/g, '$1');

// Inject HTML comment immediately before </head>.
const headInjection = `    <!-- bfp:${fingerprint} -->\n  </head>`;
if (!next.includes('</head>')) {
  console.error('[inject-fingerprint] FAIL — no </head> tag in dist/index.html');
  process.exit(1);
}
next = next.replace('</head>', headInjection.replace(/^\s+/, ''));

// Inject class onto root div.
next = next.replace(
  /<div id="root">/,
  `<div id="root" class="bfp-${fingerprint}">`
);

if (next === html) {
  console.error('[inject-fingerprint] FAIL — no markers injected');
  process.exit(1);
}

writeFileSync(HTML, next, 'utf8');

if (!existsSync(MANIFEST_DIR)) {
  mkdirSync(MANIFEST_DIR, { recursive: true, mode: 0o700 });
}
appendFileSync(
  MANIFEST,
  `${buildIso}\t${gitSha}\t${fingerprint}\n`,
  { mode: 0o600 }
);

console.log(`[inject-fingerprint] bfp:${fingerprint} (sha:${gitSha}) → manifest @ ${MANIFEST}`);
