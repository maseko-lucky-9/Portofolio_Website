// HTML layout for statically-generated content pages.
// Renders to a fully self-contained document — no JS, no React. Crawlers
// + AI engines see real content immediately; humans get a fast static
// page with sensible navigation back to the SPA.
//
// Keep this lean: every byte added ships on every blog/answers page.

const SITE_ORIGIN = 'https://thulanimaseko.com';

// Schema builders re-implemented here as plain JS (src/seo/schemaBuilders.ts
// is TypeScript and can't be imported directly from a Node script without a
// transpile step). Keep this file's output identical to the TS version's —
// if you change one, change the other. The TS module is exercised by
// schemaBuilders.test.ts as the canonical reference.
const PERSON_ID = `${SITE_ORIGIN}/#thulani`;

function buildBlogPosting(post) {
  const url = `${SITE_ORIGIN}/blog/${post.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#blogposting`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: post.headline,
    description: post.description,
    image: post.image,
    datePublished: post.datePublished,
    dateModified: post.dateModified ?? post.datePublished,
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
    ...(post.wordCount && { wordCount: post.wordCount }),
    ...(post.keywords && post.keywords.length && { keywords: post.keywords.join(', ') }),
  };
}

function buildSpeakableArticle(input) {
  const url = `${SITE_ORIGIN}/${input.slug.replace(/^\//, '')}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: input.headline,
    description: input.description,
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: input.speakableSelectors ?? ['h1', '.lead', '[data-speakable]'],
    },
  };
}

function buildBreadcrumbList(crumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

function buildCreativeWork(project) {
  const url = `${SITE_ORIGIN}/projects/${project.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': ['CreativeWork', 'SoftwareSourceCode'],
    '@id': `${url}#project`,
    name: project.name,
    description: project.description,
    url,
    author: { '@id': PERSON_ID },
    ...(project.programmingLanguages && project.programmingLanguages.length && {
      programmingLanguage: project.programmingLanguages,
    }),
    ...(project.codeRepository && { codeRepository: project.codeRepository }),
    ...(project.runtimePlatform && { runtimePlatform: project.runtimePlatform }),
    ...(project.dateCreated && { dateCreated: project.dateCreated }),
  };
}

const KIND_LABEL = { blog: 'Blog', answers: 'Answers', projects: 'Projects' };
const KIND_INDEX_DESCRIPTION = {
  blog: 'Notes on building software platforms, Kubernetes operations, and trading systems.',
  answers: 'Long-form answers to engineering questions worth bookmarking.',
  projects: 'Case studies from shipped projects — what was built, how, and what it taught me.',
};

// Inline CSS — small, self-contained, readable. Doesn't depend on the
// Vite-hashed app stylesheet. ~3 KB raw; far cheaper than loading the
// 35 KB app CSS just to render text.
const INLINE_CSS = `
  :root {
    color-scheme: light dark;
    --bg: #f5f2ee;
    --fg: #0b0d14;
    --muted: #5b5e6b;
    --accent: #d9744e;
    --border: rgba(11, 13, 20, 0.08);
    --font-body: ui-serif, "Source Serif 4", Georgia, serif;
    --font-sans: system-ui, -apple-system, "Inter", sans-serif;
    --font-mono: ui-monospace, "JetBrains Mono", Menlo, monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0b0d14; --fg: #f5f2ee; --muted: #a4a8b3; --border: rgba(245, 242, 238, 0.10); }
  }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 17px/1.65 var(--font-body); }
  header.site, footer.site { font-family: var(--font-sans); }
  header.site { position: sticky; top: 0; backdrop-filter: blur(8px); background: color-mix(in srgb, var(--bg) 86%, transparent);
    border-bottom: 1px solid var(--border); padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; }
  header.site a { color: var(--fg); text-decoration: none; font-weight: 600; }
  header.site nav { display: flex; gap: 24px; font-size: 14px; }
  header.site nav a { color: var(--muted); font-weight: 500; }
  header.site nav a:hover { color: var(--accent); }
  main.article { max-width: 720px; margin: 0 auto; padding: 56px 24px; }
  nav.breadcrumbs { font-family: var(--font-sans); font-size: 13px; color: var(--muted); margin-bottom: 24px; }
  nav.breadcrumbs a { color: var(--muted); text-decoration: none; }
  nav.breadcrumbs a:hover { color: var(--accent); }
  h1 { font-family: var(--font-sans); font-size: 40px; line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 8px; font-weight: 700; }
  .meta { font-family: var(--font-sans); font-size: 13px; color: var(--muted); margin: 0 0 32px; display: flex; gap: 16px; flex-wrap: wrap; }
  .lead { font-size: 19px; line-height: 1.5; color: var(--muted); margin: 0 0 32px; }
  h2 { font-family: var(--font-sans); font-size: 26px; line-height: 1.25; letter-spacing: -0.01em; margin: 48px 0 16px; font-weight: 700; }
  h3 { font-family: var(--font-sans); font-size: 20px; line-height: 1.3; margin: 32px 0 12px; font-weight: 600; }
  p { margin: 0 0 20px; }
  a { color: var(--accent); text-underline-offset: 3px; }
  ul, ol { padding-left: 20px; margin: 0 0 20px; }
  li { margin-bottom: 6px; }
  code { font: 14px/1.6 var(--font-mono); background: color-mix(in srgb, var(--fg) 6%, transparent); padding: 1px 6px; border-radius: 4px; }
  pre { font: 14px/1.55 var(--font-mono); background: color-mix(in srgb, var(--fg) 4%, transparent); border: 1px solid var(--border);
    padding: 16px 20px; border-radius: 6px; overflow-x: auto; margin: 0 0 24px; }
  pre code { background: none; padding: 0; border-radius: 0; }
  blockquote { border-left: 3px solid var(--accent); margin: 0 0 24px; padding: 4px 0 4px 20px; color: var(--muted); font-style: italic; }
  hr { border: 0; border-top: 1px solid var(--border); margin: 48px 0; }
  dl dt { font-weight: 600; margin-top: 16px; }
  dl dd { margin: 4px 0 0; color: var(--muted); }
  footer.site { max-width: 720px; margin: 0 auto; padding: 32px 24px 48px; color: var(--muted); font-size: 13px;
    border-top: 1px solid var(--border); }
  footer.site a { color: var(--muted); }
  .speakable { /* hook for SpeakableSpecification[cssSelector] — no visual effect */ }
  @media (max-width: 600px) {
    main.article { padding: 40px 20px; }
    h1 { font-size: 32px; }
    h2 { font-size: 22px; }
  }
`.replace(/\s+/g, ' ').trim();

function escape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function jsonLd(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
}

/**
 * @param {object} args
 * @param {'blog'|'answers'} args.kind
 * @param {string} args.slug
 * @param {string} args.title
 * @param {string} args.description
 * @param {string} args.datePublished  ISO 8601
 * @param {string} [args.dateModified]
 * @param {string[]} [args.keywords]
 * @param {number} [args.wordCount]
 * @param {string} args.htmlBody    Rendered HTML from markdown
 */
export function renderPage(args) {
  const { kind, slug, title, description, datePublished, dateModified, keywords, wordCount, htmlBody,
    programmingLanguages, codeRepository, runtimePlatform } = args;
  const url = `${SITE_ORIGIN}/${kind}/${slug}`;
  // Per-post OG card generated at build time by build-og-images.mjs.
  // Falls back to home.png if the script hasn't been run (or for kinds
  // without a generated card).
  const ogImage = `${SITE_ORIGIN}/og/${kind}-${slug}.png`;
  const kindLabel = KIND_LABEL[kind] ?? kind;

  let primarySchema;
  if (kind === 'blog') {
    primarySchema = buildBlogPosting({ slug, headline: title, description, datePublished, dateModified, image: ogImage, wordCount, keywords });
  } else if (kind === 'projects') {
    primarySchema = buildCreativeWork({
      slug, name: title, description, programmingLanguages, codeRepository, runtimePlatform,
      dateCreated: datePublished,
    });
  } else {
    primarySchema = buildSpeakableArticle({ slug: `${kind}/${slug}`, headline: title, description, speakableSelectors: ['h1', '.lead', '.speakable'] });
  }

  const schemas = [
    primarySchema,
    buildBreadcrumbList([
      { name: 'Home', url: `${SITE_ORIGIN}/` },
      { name: kindLabel, url: `${SITE_ORIGIN}/${kind}` },
      { name: title, url },
    ]),
  ];

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escape(title)} — Thulani Maseko</title>
    <meta name="description" content="${escape(description)}" />
    <meta name="author" content="Thulani Maseko" />
    <link rel="canonical" href="${url}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <meta name="robots" content="noai, noimageai" />
    <link rel="alternate" hreflang="en-ZA" href="${url}" />
    <link rel="alternate" hreflang="en" href="${url}" />
    <link rel="alternate" hreflang="x-default" href="${url}" />
    <meta name="geo.region" content="ZA-GP" />
    <meta name="ai-content-declaration" content="human-authored" />

    <meta property="og:site_name" content="Thulani Maseko" />
    <meta property="og:title" content="${escape(title)}" />
    <meta property="og:description" content="${escape(description)}" />
    <meta property="og:type" content="${kind === 'blog' ? 'article' : 'article'}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:locale" content="en_ZA" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:alt" content="OpenGraph card: ${escape(title)} — ${kindLabel} by Thulani Maseko" />
    <meta property="article:published_time" content="${datePublished}" />
    ${dateModified ? `<meta property="article:modified_time" content="${dateModified}" />` : ''}
    <meta property="article:author" content="Thulani Maseko" />
    ${(keywords || []).map((k) => `<meta property="article:tag" content="${escape(k)}" />`).join('\n    ')}

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escape(title)}" />
    <meta name="twitter:description" content="${escape(description)}" />
    <meta name="twitter:image" content="${ogImage}" />
    <meta name="twitter:image:alt" content="OpenGraph card: ${escape(title)} — ${kindLabel} by Thulani Maseko" />

    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="alternate icon" href="/favicon.ico" />
    <meta name="theme-color" content="#0B0D14" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="#F5F2EE" media="(prefers-color-scheme: light)" />
    <link rel="alternate" type="application/rss+xml" title="Thulani Maseko - Blog &amp; Answers" href="${SITE_ORIGIN}/rss.xml" />

    ${schemas.map(jsonLd).join('\n    ')}

    <style>${INLINE_CSS}</style>

    <script defer data-domain="thulanimaseko.com" src="https://plausible.io/js/script.js"></script>
  </head>
  <body>
    <header class="site">
      <a href="/">Thulani Maseko</a>
      <nav>
        <a href="/">Home</a>
        <a href="/blog">Blog</a>
        <a href="/answers">Answers</a>
        <a href="/#contact">Contact</a>
      </nav>
    </header>

    <main class="article">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> &rsaquo; <a href="/${kind}">${kindLabel}</a> &rsaquo; ${escape(title)}
      </nav>
      <h1>${escape(title)}</h1>
      <p class="meta">
        <time datetime="${datePublished}">${new Date(datePublished).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
        ${wordCount ? `<span>${wordCount} words · ~${Math.max(1, Math.round(wordCount / 220))} min read</span>` : ''}
        ${(keywords || []).length ? `<span>${keywords.map(escape).join(' · ')}</span>` : ''}
      </p>
      <p class="lead">${escape(description)}</p>
      <hr />
      ${htmlBody}
    </main>

    <footer class="site">
      <p>By <a href="/">Thulani Maseko</a> — software developer based in Gauteng, South Africa. <a href="/#contact">Get in touch</a>.</p>
      <p>This page was statically generated for crawlers and AI engines. <a href="/">Visit the full site &rarr;</a></p>
    </footer>
  </body>
</html>
`;
}

/**
 * Render an index page listing all posts of a given kind.
 */
export function renderIndex(kind, posts) {
  const kindLabel = KIND_LABEL[kind] ?? kind;
  const url = `${SITE_ORIGIN}/${kind}`;
  const description = KIND_INDEX_DESCRIPTION[kind] ?? 'Index';

  const indexOgImage = `${SITE_ORIGIN}/og/${kind}-index.png`;

  const items = posts
    .map(
      (p) => `<li>
          <a href="/${kind}/${p.slug}">${escape(p.title)}</a>
          <p class="meta"><time datetime="${p.datePublished}">${new Date(p.datePublished).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</time></p>
          <p>${escape(p.description)}</p>
        </li>`
    )
    .join('\n        ');

  const schema = buildBreadcrumbList([
    { name: 'Home', url: `${SITE_ORIGIN}/` },
    { name: kindLabel, url },
  ]);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${kindLabel} — Thulani Maseko</title>
    <meta name="description" content="${escape(description)}" />
    <link rel="canonical" href="${url}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="robots" content="noai, noimageai" />
    <meta property="og:title" content="${kindLabel} — Thulani Maseko" />
    <meta property="og:description" content="${escape(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${indexOgImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${indexOgImage}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="alternate" type="application/rss+xml" title="Thulani Maseko - Blog &amp; Answers" href="${SITE_ORIGIN}/rss.xml" />
    ${jsonLd(schema)}
    <style>${INLINE_CSS}
      main.article ul { list-style: none; padding: 0; }
      main.article ul li { padding: 24px 0; border-bottom: 1px solid var(--border); margin: 0; }
      main.article ul li a { font-family: var(--font-sans); font-size: 22px; font-weight: 600; color: var(--fg); text-decoration: none; }
      main.article ul li a:hover { color: var(--accent); }
      main.article ul li p { margin: 6px 0 0; color: var(--muted); }
    </style>
    <script defer data-domain="thulanimaseko.com" src="https://plausible.io/js/script.js"></script>
  </head>
  <body>
    <header class="site">
      <a href="/">Thulani Maseko</a>
      <nav>
        <a href="/">Home</a>
        <a href="/blog">Blog</a>
        <a href="/answers">Answers</a>
        <a href="/#contact">Contact</a>
      </nav>
    </header>

    <main class="article">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> &rsaquo; ${kindLabel}
      </nav>
      <h1>${kindLabel}</h1>
      <p class="lead">${escape(description)}</p>
      <ul>
        ${items}
      </ul>
    </main>

    <footer class="site">
      <p>By <a href="/">Thulani Maseko</a> — software developer based in Gauteng, South Africa.</p>
    </footer>
  </body>
</html>
`;
}
