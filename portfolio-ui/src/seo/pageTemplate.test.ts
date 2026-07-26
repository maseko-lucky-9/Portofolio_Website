// Smoke tests for the static page generator's HTML output. The template
// lives in scripts/seo/page-template.mjs (plain ESM, callable from the
// build pipeline). These tests validate the rendered HTML for each kind:
//   - Required <meta> + canonical + hreflang present
//   - Correct JSON-LD type per kind (BlogPosting / Article / CreativeWork)
//   - BreadcrumbList positions monotonically increase
//   - Title escapes HTML entities

import { describe, expect, it } from "vitest";

// page-template.mjs is plain ESM outside the app tsconfig's program, so these
// imports are implicitly `any` (tolerated only because noImplicitAny is off).
// It needed a @ts-expect-error until 2026-07-26; that directive is now unused,
// but the underlying gap it documented still stands.
import { renderPage, renderIndex } from "../../scripts/seo/page-template.mjs";

function extractJsonLdBlocks(html: string): unknown[] {
  const re = /<script type="application\/ld\+json">(.*?)<\/script>/gs;
  return Array.from(html.matchAll(re), (m) => JSON.parse(m[1]));
}

function findSchemaByType(blocks: unknown[], type: string): Record<string, unknown> | undefined {
  return blocks.find((b) => {
    const t = (b as { "@type"?: unknown })["@type"];
    if (typeof t === "string") return t === type;
    if (Array.isArray(t)) return t.includes(type);
    return false;
  }) as Record<string, unknown> | undefined;
}

describe("renderPage — blog kind", () => {
  const html = renderPage({
    kind: "blog",
    slug: "test-post",
    title: "Test Post Title",
    description: "A test description.",
    datePublished: "2026-05-20T08:00:00+02:00",
    keywords: ["kubernetes", "argocd"],
    wordCount: 850,
    htmlBody: "<p>Body content.</p>",
  });

  it("includes canonical URL", () => {
    expect(html).toContain(
      '<link rel="canonical" href="https://thulanimaseko.com/blog/test-post" />',
    );
  });

  it("includes hreflang cluster", () => {
    expect(html).toContain('hreflang="en-ZA"');
    expect(html).toContain('hreflang="en"');
    expect(html).toContain('hreflang="x-default"');
  });

  it("includes noai robots meta", () => {
    expect(html).toContain('<meta name="robots" content="noai, noimageai" />');
  });

  it("emits BlogPosting JSON-LD with required fields", () => {
    const blocks = extractJsonLdBlocks(html);
    const blog = findSchemaByType(blocks, "BlogPosting");
    expect(blog).toBeDefined();
    expect(blog!.headline).toBe("Test Post Title");
    expect(blog!.datePublished).toBe("2026-05-20T08:00:00+02:00");
    expect(blog!.wordCount).toBe(850);
    expect(blog!.keywords).toBe("kubernetes, argocd");
  });

  it("emits BreadcrumbList with monotonic positions starting at 1", () => {
    const blocks = extractJsonLdBlocks(html);
    const crumbs = findSchemaByType(blocks, "BreadcrumbList");
    expect(crumbs).toBeDefined();
    const items = crumbs!.itemListElement as Array<{ position: number; name: string }>;
    expect(items).toHaveLength(3);
    expect(items[0].position).toBe(1);
    expect(items[2].position).toBe(3);
    expect(items.map((i) => i.name)).toEqual(["Home", "Blog", "Test Post Title"]);
  });

  it("escapes HTML entities in title to prevent injection", () => {
    const malicious = renderPage({
      kind: "blog",
      slug: "xss",
      title: "<script>alert(1)</script>",
      description: "d",
      datePublished: "2026-05-20T00:00:00Z",
      htmlBody: "",
    });
    expect(malicious).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});

describe("renderPage — answers kind", () => {
  const html = renderPage({
    kind: "answers",
    slug: "why-x",
    title: "Why X",
    description: "d",
    datePublished: "2026-05-20T00:00:00Z",
    htmlBody: "<p>body</p>",
  });

  it("emits Article JSON-LD (not BlogPosting)", () => {
    const blocks = extractJsonLdBlocks(html);
    expect(findSchemaByType(blocks, "Article")).toBeDefined();
    expect(findSchemaByType(blocks, "BlogPosting")).toBeUndefined();
  });

  it("includes speakable selectors for voice-search eligibility", () => {
    const blocks = extractJsonLdBlocks(html);
    const article = findSchemaByType(blocks, "Article");
    const speakable = article!.speakable as { cssSelector: string[] };
    expect(speakable.cssSelector).toContain("h1");
    expect(speakable.cssSelector).toContain(".lead");
  });
});

describe("renderPage — projects kind", () => {
  const html = renderPage({
    kind: "projects",
    slug: "homelab",
    title: "Homelab project",
    description: "d",
    datePublished: "2026-05-20T00:00:00Z",
    programmingLanguages: ["TypeScript", "Go"],
    codeRepository: "https://github.com/example/repo",
    runtimePlatform: "Kubernetes",
    htmlBody: "<p>body</p>",
  });

  it("emits CreativeWork + SoftwareSourceCode types", () => {
    const blocks = extractJsonLdBlocks(html);
    const project = blocks.find((b) => {
      const t = (b as { "@type"?: unknown })["@type"];
      return Array.isArray(t) && t.includes("CreativeWork") && t.includes("SoftwareSourceCode");
    }) as Record<string, unknown> | undefined;
    expect(project).toBeDefined();
    expect(project!.programmingLanguage).toEqual(["TypeScript", "Go"]);
    expect(project!.codeRepository).toBe("https://github.com/example/repo");
    expect(project!.runtimePlatform).toBe("Kubernetes");
  });
});

describe("renderIndex", () => {
  it("renders blog index with all post titles linkable", () => {
    const html = renderIndex("blog", [
      { slug: "a", title: "Alpha", description: "d1", datePublished: "2026-05-20T00:00:00Z" },
      { slug: "b", title: "Beta", description: "d2", datePublished: "2026-05-19T00:00:00Z" },
    ]);
    expect(html).toContain('href="/blog/a"');
    expect(html).toContain('href="/blog/b"');
    expect(html).toContain(">Alpha<");
    expect(html).toContain(">Beta<");
  });

  it("renders projects index with the projects-specific description", () => {
    const html = renderIndex("projects", []);
    expect(html).toContain("Case studies from shipped projects");
  });
});
