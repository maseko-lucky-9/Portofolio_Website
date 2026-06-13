/**
 * JSON-LD payload builders for structured data per route.
 *
 * Used by per-route components once the A1 prerender refactor lands.
 * Keep these pure (no React imports) so they can be unit-tested and
 * also invoked from build scripts (e.g., a future static-validation
 * pass that POSTs each payload to validator.schema.org).
 *
 * All builders return plain objects — stringify at the call site so
 * the test surface stays trivial.
 */

const SITE_ORIGIN = "https://thulanimaseko.com";
const PERSON_ID = `${SITE_ORIGIN}/#thulani`;

export interface BreadcrumbCrumb {
  name: string;
  url: string;
}

export function buildBreadcrumbList(
  crumbs: BreadcrumbCrumb[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

export interface BlogPostingInput {
  slug: string;
  headline: string;
  description: string;
  datePublished: string; // ISO 8601
  dateModified?: string;
  image: string;
  wordCount?: number;
  keywords?: string[];
}

export function buildBlogPosting(
  post: BlogPostingInput,
): Record<string, unknown> {
  const url = `${SITE_ORIGIN}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#blogposting`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: post.headline,
    description: post.description,
    image: post.image,
    datePublished: post.datePublished,
    dateModified: post.dateModified ?? post.datePublished,
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
    ...(post.wordCount && { wordCount: post.wordCount }),
    ...(post.keywords && { keywords: post.keywords.join(", ") }),
  };
}

export interface ProjectInput {
  slug: string;
  name: string;
  description: string;
  programmingLanguages: string[];
  codeRepository?: string;
  runtimePlatform?: string;
  image?: string;
  dateCreated?: string;
}

export function buildCreativeWork(
  project: ProjectInput,
): Record<string, unknown> {
  const url = `${SITE_ORIGIN}/projects/${project.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": ["CreativeWork", "SoftwareSourceCode"],
    "@id": `${url}#project`,
    name: project.name,
    description: project.description,
    url,
    author: { "@id": PERSON_ID },
    programmingLanguage: project.programmingLanguages,
    ...(project.codeRepository && { codeRepository: project.codeRepository }),
    ...(project.runtimePlatform && {
      runtimePlatform: project.runtimePlatform,
    }),
    ...(project.image && { image: project.image }),
    ...(project.dateCreated && { dateCreated: project.dateCreated }),
  };
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export function buildFaqPage(entries: FaqEntry[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: { "@type": "Answer", text: e.answer },
    })),
  };
}

export interface SpeakableArticleInput {
  slug: string;
  headline: string;
  description: string;
  speakableSelectors?: string[]; // CSS selectors for voice-search-eligible blocks
}

export function buildSpeakableArticle(
  input: SpeakableArticleInput,
): Record<string, unknown> {
  const url = `${SITE_ORIGIN}/${input.slug.replace(/^\//, "")}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: input.headline,
    description: input.description,
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: input.speakableSelectors ?? [
        "h1",
        ".lead",
        "[data-speakable]",
      ],
    },
  };
}
