#!/usr/bin/env node
// Inlines search-engine verification meta tags into dist/index.html if
// the corresponding env vars are present. No-op when absent, so local
// builds stay clean.
//
// Variables consumed (any prefix accepted: VITE_*, plain name, CF_VAR_*):
//   GSC_VERIFICATION   → <meta name="google-site-verification" content="..." />
//   BING_VERIFICATION  → <meta name="msvalidate.01" content="..." />
//   YANDEX_VERIFICATION → <meta name="yandex-verification" content="..." />
//
// In Cloudflare Workers Builds, set these as plain dashboard env vars
// (Settings → Variables and Secrets → Build). Locally, place in .env
// or export before `npm run build`.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const HTML = resolve(REPO_ROOT, 'dist/index.html');
const MARKER = '<!-- VERIFICATION_INJECT -->';

if (!existsSync(HTML)) {
  console.error('[inject-verification] dist/index.html not found — run vite build first');
  process.exit(1);
}

function pick(...names) {
  for (const n of names) {
    if (process.env[n] && process.env[n].trim()) return process.env[n].trim();
  }
  return null;
}

const gsc = pick('GSC_VERIFICATION', 'VITE_GSC_VERIFICATION', 'CF_VAR_GSC_VERIFICATION');
const bing = pick('BING_VERIFICATION', 'VITE_BING_VERIFICATION', 'CF_VAR_BING_VERIFICATION');
const yandex = pick('YANDEX_VERIFICATION', 'VITE_YANDEX_VERIFICATION');

const tags = [];
if (gsc) tags.push(`<meta name="google-site-verification" content="${gsc}" />`);
if (bing) tags.push(`<meta name="msvalidate.01" content="${bing}" />`);
if (yandex) tags.push(`<meta name="yandex-verification" content="${yandex}" />`);

if (tags.length === 0) {
  console.log('[inject-verification] no tokens in env — skipping (set GSC_VERIFICATION / BING_VERIFICATION to enable)');
  process.exit(0);
}

const html = readFileSync(HTML, 'utf8');
const injection = `${MARKER}\n    ${tags.join('\n    ')}\n    ${MARKER}`;

let next;
if (html.includes(MARKER)) {
  // Replace previous injection (idempotent — handles re-builds in watch mode).
  const re = new RegExp(`${MARKER}[\\s\\S]*?${MARKER}`);
  next = html.replace(re, injection);
} else {
  // Insert right after the canonical link, matching the index.html structure.
  next = html.replace(
    /(<link rel="canonical"[^>]*>)/,
    `$1\n\n    ${injection}`
  );
}

if (next === html) {
  console.error('[inject-verification] FAIL — could not find injection anchor in dist/index.html');
  process.exit(1);
}

writeFileSync(HTML, next, 'utf8');
const which = [gsc && 'GSC', bing && 'Bing', yandex && 'Yandex'].filter(Boolean).join(', ');
console.log(`[inject-verification] injected ${tags.length} tag(s): ${which}`);
