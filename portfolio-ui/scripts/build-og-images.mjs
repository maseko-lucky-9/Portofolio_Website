#!/usr/bin/env node
// Generates per-page OpenGraph card images (1200x630 PNG) for every
// content post in dist/content-manifest.json. Satori 0.26+ ingests
// woff2 directly (built-in wawoff2 decompression), so we can use the
// existing @fontsource-variable/public-sans assets without vendoring
// a TTF.
//
// Output: dist/og/<kind>-<slug>.png (one per post)
//   plus  dist/og/<kind>-index.png (one per kind index page)
//
// Pipeline order: must run AFTER build-static-pages.mjs.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import wawoff from 'wawoff2';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const MONOREPO_ROOT = resolve(REPO_ROOT, '..');
const DIST = resolve(REPO_ROOT, 'dist');
const OUT_DIR = resolve(DIST, 'og');
const MANIFEST = resolve(DIST, 'content-manifest.json');

// Resolve font through workspace-hoisted node_modules.
function loadFont(name) {
  const candidates = [
    resolve(REPO_ROOT, 'node_modules', name),
    resolve(MONOREPO_ROOT, 'node_modules', name),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return readFileSync(c);
  }
  throw new Error('[build-og-images] font not found: ' + name);
}

// Satori opentype parser can't ingest woff2 directly; decompress to TTF.
// Variable fonts trip @shuding/opentype.js on the fvar table, so both faces
// here are the STATIC per-weight packages — which is also why the body face is
// JetBrains Mono rather than Public Sans, whose only build is variable.
//
// Spectral italic is the display face and carries the headline, matching the
// site; the mono carries the kicker and byline, matching its micro-labels.
const DISPLAY_WOFF2 = loadFont('@fontsource/spectral/files/spectral-latin-400-italic.woff2');
const MONO_WOFF2 = loadFont('@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2');
const MONO_MED_WOFF2 = loadFont('@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2');
const FONT_DISPLAY = Buffer.from(await wawoff.decompress(DISPLAY_WOFF2));
const FONT_MONO = Buffer.from(await wawoff.decompress(MONO_WOFF2));
const FONT_MONO_MED = Buffer.from(await wawoff.decompress(MONO_MED_WOFF2));

// The site's own tokens, resolved to hex because satori takes no CSS variables:
// --surface-page, --ink-100, --ink-60, --signal, --border-component.
const BG = '#020305';
const FG = '#ffffff';
const MUTED = 'rgba(255, 255, 255, 0.6)';
const ACCENT = '#38bdf8';
const BORDER = 'rgba(255, 255, 255, 0.10)';

const KIND_LABEL = { blog: 'BLOG', answers: 'ANSWERS', projects: 'PROJECTS' };

function card({ kindLabel, title, byline }) {
  // Satori takes a React-like object tree. No JSX in .mjs scripts, so
  // we construct nodes by hand. `display: flex` is required on every
  // container with multiple children (satori limitation).
  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 88px',
        background: BG,
        color: FG,
        fontFamily: 'JetBrains Mono',
        position: 'relative',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: 32 },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: 22,
                    fontWeight: 500,
                    letterSpacing: 4,
                    color: ACCENT,
                  },
                  children: kindLabel,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: 64,
                    lineHeight: 1.1,
                    letterSpacing: -1,
                    fontFamily: 'Spectral',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    color: FG,
                    maxWidth: 1024,
                  },
                  children: title,
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingTop: 24,
              borderTop: '1px solid ' + BORDER,
              fontSize: 22,
              color: MUTED,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column', gap: 4 },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex', fontWeight: 500, color: FG, fontSize: 24 },
                        children: 'Thulani Maseko',
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex' },
                        children: byline ?? 'thulanimaseko.co.za',
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', fontSize: 18, letterSpacing: 1.5 },
                  children: 'thulanimaseko.co.za',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

async function renderCard(card, outPath) {
  const svg = await satori(card, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'JetBrains Mono', data: FONT_MONO, weight: 400, style: 'normal' },
      { name: 'JetBrains Mono', data: FONT_MONO_MED, weight: 500, style: 'normal' },
      { name: 'Spectral', data: FONT_DISPLAY, weight: 400, style: 'italic' },
    ],
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  writeFileSync(outPath, png);
}

if (!existsSync(MANIFEST)) {
  console.error('[build-og-images] content-manifest.json missing - run build-static-pages first');
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));

let count = 0;
const KIND_INDEX_TITLE = {
  blog: 'Writing on software, infra, and the bits in between',
  answers: 'Long-form answers worth bookmarking',
  projects: 'Case studies from shipped projects',
};

for (const [kind, posts] of Object.entries(manifest)) {
  await renderCard(
    card({
      kindLabel: KIND_LABEL[kind] ?? kind.toUpperCase(),
      title: KIND_INDEX_TITLE[kind] ?? kind,
      byline: posts.length + ' post' + (posts.length === 1 ? '' : 's'),
    }),
    join(OUT_DIR, kind + '-index.png')
  );
  count++;

  for (const post of posts) {
    const byline = new Date(post.datePublished).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    await renderCard(
      card({ kindLabel: KIND_LABEL[kind] ?? kind.toUpperCase(), title: post.title, byline }),
      join(OUT_DIR, kind + '-' + post.slug + '.png')
    );
    count++;
  }
}

console.log('[build-og-images] rendered ' + count + ' card(s) -> ' + OUT_DIR);
