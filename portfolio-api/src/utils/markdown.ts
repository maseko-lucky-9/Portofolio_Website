import matter from 'gray-matter';
import { marked } from 'marked';
import Prism from 'prismjs';
import readingTime from 'reading-time';

// Load additional Prism languages
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-go.js';
import 'prismjs/components/prism-sql.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-yaml.js';
import 'prismjs/components/prism-docker.js';
import 'prismjs/components/prism-graphql.js';

// Configure marked with syntax highlighting
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Custom renderer for code blocks with syntax highlighting
const renderer = new marked.Renderer();

renderer.code = function (code: string, language?: string): string {
  const lang = language || 'text';
  const grammar = Prism.languages[lang] || Prism.languages['text'];
  
  let highlighted: string;
  try {
    highlighted = grammar ? Prism.highlight(code, grammar, lang) : code;
  } catch {
    highlighted = code;
  }
  
  return `<pre class="language-${lang}"><code class="language-${lang}">${highlighted}</code></pre>`;
};

marked.use({ renderer });

// Frontmatter + Markdown parsing
export interface ParsedMarkdown {
  content: string;
  html: string;
  frontmatter: Record<string, unknown>;
  excerpt: string;
  readingTime: {
    text: string;
    minutes: number;
    time: number;
    words: number;
  };
  wordCount: number;
  toc: TableOfContentsItem[];
}

export interface TableOfContentsItem {
  level: number;
  text: string;
  slug: string;
}

// Generate slug from text
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Extract table of contents from markdown
export const extractToc = (markdown: string): TableOfContentsItem[] => {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const toc: TableOfContentsItem[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const slug = slugify(text);

    toc.push({ level, text, slug });
  }

  return toc;
};

// Generate excerpt from content
export const generateExcerpt = (content: string, maxLength: number = 200): string => {
  // Remove markdown formatting
  const plainText = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with text
    .replace(/[#*_~>\-|]/g, '') // Remove markdown chars
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Truncate at word boundary
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.substring(0, lastSpace) + '...';
};

// Parse markdown with frontmatter
export const parseMarkdown = (rawContent: string): ParsedMarkdown => {
  // Parse frontmatter
  const { data: frontmatter, content } = matter(rawContent);

  // Calculate reading time
  const stats = readingTime(content);

  // Extract TOC before rendering
  const toc = extractToc(content);

  // Add IDs to headings
  const contentWithIds = content.replace(
    /^(#{1,6})\s+(.+)$/gm,
    (_match, hashes: string, text: string) => {
      const slug = slugify(text);
      return `${hashes} ${text} {#${slug}}`;
    }
  );

  // Render markdown to HTML
  const html = marked(contentWithIds) as string;

  // Generate excerpt if not provided in frontmatter
  const excerpt = (frontmatter.excerpt as string) || generateExcerpt(content);

  return {
    content,
    html,
    frontmatter,
    excerpt,
    readingTime: {
      text: stats.text,
      minutes: Math.ceil(stats.minutes),
      time: stats.time,
      words: stats.words,
    },
    wordCount: stats.words,
    toc,
  };
};

// Render markdown to HTML (without frontmatter parsing)
export const renderMarkdown = (content: string): string => {
  return marked(content) as string;
};

// Strip HTML tags
export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

// Get word count from content
export const getWordCount = (content: string): number => {
  return readingTime(content).words;
};

// Get reading time in minutes
export const getReadingTime = (content: string): number => {
  return Math.ceil(readingTime(content).minutes);
};
