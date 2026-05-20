#!/usr/bin/env node
// Generates static HTML pages for /blog/<slug> and /answers/<slug> from
// markdown sources in content/. Each generated page is a fully
// self-contained crawler-friendly document - no JS dependency.

import { readdirSync, readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeStringify from 'rehype-stringify';

import { renderPage, renderIndex } from './seo/page-template.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const CONTENT_ROOT = resolve(REPO_ROOT, 'content');
const DIST = resolve(REPO_ROOT, 'dist');

const KINDS = ['blog', 'answers', 'projects'];
const BT = String.fromCharCode(96); // backtick literal kept out of source
const CODE_FENCE_RE = new RegExp(BT + BT + BT + '[\\s\\S]*?' + BT + BT + BT, 'g');
const PUNCT_RE = new RegExp('[#>*_\\-' + BT + ']', 'g');

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings, { behavior: 'wrap' })
  .use(rehypeStringify);

function wordCount(markdown) {
  return markdown
    .replace(CODE_FENCE_RE, '')
    .replace(PUNCT_RE, '')
    .split(/\s+/)
    .filter(Boolean).length;
}

async function renderMarkdown(md) {
  const file = await processor.process(md);
  return String(file);
}

function listMarkdown(kind) {
  const dir = join(CONTENT_ROOT, kind);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => extname(f) === '.md' && !f.startsWith('_'))
    .map((f) => join(dir, f));
}

async function buildPost(kind, filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);

  const slug = data.slug ?? basename(filePath, '.md');
  const required = ['title', 'description', 'datePublished'];
  for (const k of required) {
    if (!data[k]) {
      throw new Error('[build-static-pages] ' + filePath + ': missing frontmatter ' + k);
    }
  }

  const htmlBody = await renderMarkdown(content);
  const wc = wordCount(content);

  const page = renderPage({
    kind,
    slug,
    title: data.title,
    description: data.description,
    datePublished: data.datePublished,
    dateModified: data.dateModified,
    keywords: data.keywords ?? data.tags ?? [],
    wordCount: wc,
    htmlBody,
    // project-specific (ignored for blog/answers)
    programmingLanguages: data.programmingLanguages ?? data.languages ?? [],
    codeRepository: data.codeRepository ?? data.repo,
    runtimePlatform: data.runtimePlatform ?? data.platform,
  });

  const outDir = join(DIST, kind, slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), page, 'utf8');

  return {
    slug,
    title: data.title,
    description: data.description,
    datePublished: data.datePublished,
    dateModified: data.dateModified,
    keywords: data.keywords ?? data.tags ?? [],
    wordCount: wc,
  };
}

async function buildKind(kind) {
  const files = listMarkdown(kind);
  if (files.length === 0) {
    console.log('[build-static-pages] ' + kind + ': no markdown files; skipping.');
    return [];
  }
  const posts = [];
  for (const f of files) {
    posts.push(await buildPost(kind, f));
  }
  posts.sort((a, b) => (a.datePublished < b.datePublished ? 1 : -1));

  const indexHtml = renderIndex(kind, posts);
  const outDir = join(DIST, kind);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), indexHtml, 'utf8');

  console.log('[build-static-pages] ' + kind + ': ' + posts.length + ' post(s) + index');
  return posts;
}

if (!existsSync(DIST)) {
  console.error('[build-static-pages] dist/ missing - run vite build first');
  process.exit(1);
}

const manifest = {};
for (const kind of KINDS) {
  manifest[kind] = await buildKind(kind);
}

writeFileSync(
  join(DIST, 'content-manifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf8'
);
console.log('[build-static-pages] wrote manifest -> dist/content-manifest.json');
