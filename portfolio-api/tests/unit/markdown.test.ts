import { describe, it, expect } from 'vitest';
import { slugify, extractToc, generateExcerpt, parseMarkdown } from '../../src/utils/markdown.js';

// I originally excluded this module as dead code. That was wrong: article.service.ts
// and project.service.ts both import parseMarkdown statically and call it at six
// sites, and article.service.ts:233 PERSISTS the derived excerpt to the row. My
// grep covered extractToc/generateExcerpt/slugify/renderMarkdown and never looked
// for parseMarkdown, the module's main export.

describe('generateExcerpt', () => {
  it('returns short content unchanged, with no ellipsis', () => {
    expect(generateExcerpt('Just a short line.')).toBe('Just a short line.');
  });

  it('truncates long prose at a word boundary', () => {
    const excerpt = generateExcerpt(`${'word '.repeat(100)}end`, 50);
    expect(excerpt.endsWith('...')).toBe(true);
    expect(excerpt.length).toBeLessThanOrEqual(53);
    // Cut at a space, so the last word is never sliced in half.
    expect(excerpt.replace(/\.\.\.$/, '').endsWith(' ')).toBe(false);
  });

  it('does NOT throw the content away when there is no space to cut at', () => {
    // The bug this test exists for. lastIndexOf(' ') is -1 for an unbroken
    // token, and substring(0, -1) is '', so this used to return the literal
    // string '...' -- and article.service.ts persists that as the excerpt.
    const excerpt = generateExcerpt('x'.repeat(300), 200);
    expect(excerpt).not.toBe('...');
    expect(excerpt).toBe(`${'x'.repeat(200)}...`);
  });

  it('handles a long URL, the realistic form of the same bug', () => {
    const excerpt = generateExcerpt(`https://example.com/${'a'.repeat(300)}`, 200);
    expect(excerpt).not.toBe('...');
    expect(excerpt.startsWith('https://example.com/')).toBe(true);
  });

  it('handles content with no spaces at all in scripts that do not use them', () => {
    const excerpt = generateExcerpt('あ'.repeat(300), 200);
    expect(excerpt).not.toBe('...');
    expect(excerpt.startsWith('あ')).toBe(true);
  });

  it('strips markdown formatting before measuring', () => {
    const excerpt = generateExcerpt('# Heading\n\nSome **bold** and `code` text.');
    expect(excerpt).not.toContain('#');
    expect(excerpt).not.toContain('**');
    expect(excerpt).not.toContain('`');
  });

  it('drops fenced code blocks entirely', () => {
    const excerpt = generateExcerpt('Intro text.\n\n```js\nconst secret = 1;\n```\n\nOutro.');
    expect(excerpt).not.toContain('const secret');
  });

  it('returns an empty string for empty input rather than an ellipsis', () => {
    expect(generateExcerpt('')).toBe('');
  });
});

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('  Trim  Me  ')).toBe('trim-me');
  });

  it('drops punctuation and collapses separators', () => {
    expect(slugify("What's New, Really?")).toBe('whats-new-really');
    expect(slugify('a___b---c')).toBe('a-b-c');
  });

  it('returns an empty string for input with nothing sluggable', () => {
    // Worth pinning rather than fixing here: every all-punctuation heading
    // collapses to the same empty anchor, so a document with two of them gets
    // duplicate TOC targets. extractToc does no de-duplication.
    expect(slugify('!!!')).toBe('');
    expect(slugify('---')).toBe('');
  });
});

describe('extractToc', () => {
  it('extracts headings with their level, text and slug', () => {
    expect(extractToc('# One\n\n## Two\n\n### Three')).toEqual([
      { level: 1, text: 'One', slug: 'one' },
      { level: 2, text: 'Two', slug: 'two' },
      { level: 3, text: 'Three', slug: 'three' },
    ]);
  });

  it('ignores a # that is not at the start of a line', () => {
    expect(extractToc('Text with a # in the middle')).toEqual([]);
  });

  it('KNOWN BUG: treats a comment inside a fenced code block as a heading', () => {
    // extractToc uses /^(#{1,6})\s+(.+)$/gm with no code-fence awareness, so a
    // shell comment becomes a table-of-contents entry. Asserted as-is rather
    // than fixed: making the regex fence-aware is a behaviour change to
    // rendering that belongs in its own PR, and leaving it undocumented would
    // mean the next person rediscovers it. Spun out as a follow-up task.
    const toc = extractToc('# Real Heading\n\n```bash\n# not a heading\nnpm install\n```\n');
    expect(toc).toHaveLength(2);
    expect(toc[1]).toEqual({ level: 1, text: 'not a heading', slug: 'not-a-heading' });
  });
});

describe('parseMarkdown', () => {
  // The actual entry point the services call.
  it('returns html, an excerpt, a toc and reading time', () => {
    const parsed = parseMarkdown('# Title\n\nSome body text that is long enough to matter.');

    expect(parsed.html).toContain('<h1');
    expect(parsed.excerpt).toContain('Some body text');
    expect(parsed.toc).toHaveLength(1);
    // readingTime is the reading-time stats object, not a number.
    expect(parsed.readingTime.words).toBeGreaterThan(0);
    expect(parsed.wordCount).toBeGreaterThan(0);
  });

  it('separates frontmatter from content', () => {
    const parsed = parseMarkdown('---\ntitle: Hello\n---\n\n# Body\n');

    expect(parsed.frontmatter).toMatchObject({ title: 'Hello' });
    expect(parsed.html).not.toContain('title: Hello');
  });

  it('survives empty input', () => {
    const parsed = parseMarkdown('');
    expect(parsed.excerpt).toBe('');
    expect(parsed.toc).toEqual([]);
  });
});
