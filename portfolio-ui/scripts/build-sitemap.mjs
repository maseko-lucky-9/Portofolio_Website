#!/usr/bin/env node
// Generates dist/sitemap.xml from the static route manifest.
// Run order (see package.json "build"): vite build → THIS → build-og → ...
//
// Exits non-zero when the URL count drops below MIN_SITEMAP_URLS, which
// catches accidental route deletions before they reach production.

import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE_ORIGIN, STATIC_ROUTES, MIN_SITEMAP_URLS } from './seo/routes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const DIST_DIR = resolve(REPO_ROOT, 'dist');
const OUTPUT = resolve(DIST_DIR, 'sitemap.xml');

// execFileSync uses argv array (no shell) — even a hostile pathSpec
// cannot inject command tokens. Hardcoded `.` here; the param is kept
// for future per-route lastmod lookups.
function gitLastMod(pathSpec) {
  try {
    const iso = execFileSync(
      'git',
      ['log', '-1', '--format=%aI', '--', pathSpec],
      { cwd: REPO_ROOT, encoding: 'utf8' }
    ).trim();
    return iso || new Date().toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const repoLastMod = gitLastMod('.');

const urls = STATIC_ROUTES.map((route) => {
  const loc = `${SITE_ORIGIN}${route.path}`;
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${repoLastMod.slice(0, 10)}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`;
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls}
</urlset>
`;

if (STATIC_ROUTES.length < MIN_SITEMAP_URLS) {
  console.error(
    `[build-sitemap] FAIL — only ${STATIC_ROUTES.length} routes; ` +
      `MIN_SITEMAP_URLS=${MIN_SITEMAP_URLS}. Check scripts/seo/routes.mjs.`
  );
  process.exit(1);
}

if (!existsSync(DIST_DIR)) {
  mkdirSync(DIST_DIR, { recursive: true });
}
writeFileSync(OUTPUT, xml, 'utf8');
console.log(
  `[build-sitemap] wrote ${STATIC_ROUTES.length} URL(s) → ${OUTPUT}`
);
