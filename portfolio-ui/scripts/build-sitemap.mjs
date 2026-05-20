#!/usr/bin/env node
// Generates dist/sitemap.xml from the static route manifest.
// Run order (see package.json "build"): vite build → THIS → build-og → ...
//
// Exits non-zero when the URL count drops below MIN_SITEMAP_URLS, which
// catches accidental route deletions before they reach production.

import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE_ORIGIN, STATIC_ROUTES, MIN_SITEMAP_URLS } from './seo/routes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const DIST_DIR = resolve(REPO_ROOT, 'dist');
const OUTPUT = resolve(DIST_DIR, 'sitemap.xml');
const MANIFEST = resolve(DIST_DIR, 'content-manifest.json');

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

// Pull dynamically-generated content routes from the manifest written by
// build-static-pages.mjs (must run before this script — see package.json).
let contentRoutes = [];
if (existsSync(MANIFEST)) {
  try {
    const m = JSON.parse(readFileSync(MANIFEST, 'utf8'));
    for (const [kind, posts] of Object.entries(m)) {
      for (const post of posts) {
        contentRoutes.push({
          path: `/${kind}/${post.slug}`,
          priority: kind === 'answers' ? 0.7 : 0.6,
          changefreq: 'monthly',
          lastmod: (post.dateModified ?? post.datePublished).slice(0, 10),
        });
      }
    }
  } catch (err) {
    console.warn(`[build-sitemap] manifest unreadable, skipping content routes: ${err.message}`);
  }
}

const allRoutes = [
  ...STATIC_ROUTES.map((r) => ({ ...r, lastmod: repoLastMod.slice(0, 10) })),
  ...contentRoutes,
];

const urls = allRoutes.map((route) => {
  const loc = `${SITE_ORIGIN}${route.path}`;
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${route.lastmod}</lastmod>
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

if (allRoutes.length < MIN_SITEMAP_URLS) {
  console.error(
    `[build-sitemap] FAIL — only ${allRoutes.length} routes (static=${STATIC_ROUTES.length}, ` +
      `content=${contentRoutes.length}); MIN_SITEMAP_URLS=${MIN_SITEMAP_URLS}.`
  );
  process.exit(1);
}

if (!existsSync(DIST_DIR)) {
  mkdirSync(DIST_DIR, { recursive: true });
}
writeFileSync(OUTPUT, xml, 'utf8');
console.log(
  `[build-sitemap] wrote ${allRoutes.length} URL(s) (${STATIC_ROUTES.length} static + ${contentRoutes.length} content) → ${OUTPUT}`
);
