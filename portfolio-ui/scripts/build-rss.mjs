#!/usr/bin/env node
// Generates dist/rss.xml from dist/content-manifest.json.
// RSS 2.0 with Atom self-link extension; consumed by feed readers and
// some AI engines (Perplexity in particular surfaces RSS-discovered
// content faster than crawler-only sites).
//
// Pipeline order: must run AFTER build-static-pages.mjs.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE_ORIGIN } from './seo/routes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const DIST = resolve(REPO_ROOT, 'dist');
const MANIFEST = resolve(DIST, 'content-manifest.json');
const OUTPUT = resolve(DIST, 'rss.xml');

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function rfc822(iso) {
  return new Date(iso).toUTCString();
}

if (!existsSync(MANIFEST)) {
  console.error('[build-rss] content-manifest.json missing - run build-static-pages.mjs first');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));

const items = [];
for (const [kind, posts] of Object.entries(manifest)) {
  for (const p of posts) {
    const link = SITE_ORIGIN + '/' + kind + '/' + p.slug;
    items.push({
      kind,
      title: p.title,
      description: p.description,
      link,
      datePublished: p.datePublished,
      keywords: p.keywords ?? [],
    });
  }
}

items.sort((a, b) => (a.datePublished < b.datePublished ? 1 : -1));

const latestPubDate = items[0]?.datePublished ?? new Date().toISOString();

const itemXml = items
  .map(
    (it) =>
      '    <item>\n' +
      '      <title>' + escapeXml(it.title) + '</title>\n' +
      '      <link>' + it.link + '</link>\n' +
      '      <guid isPermaLink="true">' + it.link + '</guid>\n' +
      '      <description>' + escapeXml(it.description) + '</description>\n' +
      '      <pubDate>' + rfc822(it.datePublished) + '</pubDate>\n' +
      '      <category>' + escapeXml(it.kind) + '</category>\n' +
      it.keywords.map((k) => '      <category>' + escapeXml(k) + '</category>').join('\n') +
      (it.keywords.length ? '\n' : '') +
      '      <author>noreply@thulanimaseko.com (Thulani Maseko)</author>\n' +
      '    </item>'
  )
  .join('\n');

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n' +
  '  <channel>\n' +
  '    <title>Thulani Maseko - Blog &amp; Answers</title>\n' +
  '    <link>' + SITE_ORIGIN + '/</link>\n' +
  '    <atom:link href="' + SITE_ORIGIN + '/rss.xml" rel="self" type="application/rss+xml" />\n' +
  '    <description>Notes on software platforms, Kubernetes operations, and trading systems. Long-form Q&amp;A on engineering decisions.</description>\n' +
  '    <language>en-ZA</language>\n' +
  '    <lastBuildDate>' + rfc822(latestPubDate) + '</lastBuildDate>\n' +
  '    <pubDate>' + rfc822(latestPubDate) + '</pubDate>\n' +
  '    <generator>build-rss.mjs (custom)</generator>\n' +
  '    <managingEditor>noreply@thulanimaseko.com (Thulani Maseko)</managingEditor>\n' +
  '    <webMaster>noreply@thulanimaseko.com (Thulani Maseko)</webMaster>\n' +
  itemXml + '\n' +
  '  </channel>\n' +
  '</rss>\n';

writeFileSync(OUTPUT, xml, 'utf8');
console.log('[build-rss] wrote ' + items.length + ' item(s) -> ' + OUTPUT);
