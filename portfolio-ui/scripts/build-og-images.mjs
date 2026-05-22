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
// Variable fonts trip @shuding/opentype.js on the fvar table, so we use
// the static (per-weight) Inter from @fontsource/inter. Two weights:
// 400 for the byline, 700 for the headline.
const REG_WOFF2 = loadFont('@fontsource/inter/files/inter-latin-400-normal.woff2');
const BOLD_WOFF2 = loadFont('@fontsource/inter/files/inter-latin-700-normal.woff2');
const FONT_REG = Buffer.from(await wawoff.decompress(REG_WOFF2));
const FONT_BOLD = Buffer.from(await wawoff.decompress(BOLD_WOFF2));

const BG = '#0b0d14';
const FG = '#f5f2ee';
const MUTED = '#a4a8b3';
const ACCENT = '#d9744e';
const BORDER = 'rgba(245, 242, 238, 0.10)';

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
        fontFamily: 'Inter',
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
                    fontWeight: 700,
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
                    fontWeight: 700,
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
                        style: { display: 'flex', fontWeight: 600, color: FG, fontSize: 24 },
                        children: 'Thulani Maseko',
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex' },
                        children: byline ?? 'thulanimaseko.com',
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', fontSize: 18, letterSpacing: 1.5 },
                  children: 'thulanimaseko.com',
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
      { name: 'Inter', data: FONT_REG, weight: 400, style: 'normal' },
      { name: 'Inter', data: FONT_BOLD, weight: 700, style: 'normal' },
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
