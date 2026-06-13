import { describe, expect, it } from "vitest";

import {
  buildBlogPosting,
  buildBreadcrumbList,
  buildCreativeWork,
  buildFaqPage,
  buildSpeakableArticle,
} from "./schemaBuilders";

describe("schemaBuilders", () => {
  it("buildBreadcrumbList — assigns positions starting at 1", () => {
    const out = buildBreadcrumbList([
      { name: "Home", url: "https://thulanimaseko.com/" },
      { name: "Projects", url: "https://thulanimaseko.com/projects" },
      { name: "Foo", url: "https://thulanimaseko.com/projects/foo" },
    ]);
    expect(out["@type"]).toBe("BreadcrumbList");
    expect(
      (out.itemListElement as Array<{ position: number }>)[0].position,
    ).toBe(1);
    expect(
      (out.itemListElement as Array<{ position: number }>)[2].position,
    ).toBe(3);
  });

  it("buildBlogPosting — uses datePublished as dateModified when latter is omitted", () => {
    const out = buildBlogPosting({
      slug: "hello",
      headline: "Hello",
      description: "desc",
      datePublished: "2026-05-01T00:00:00Z",
      image: "https://thulanimaseko.com/og/blog-hello.png",
    });
    expect(out.dateModified).toBe("2026-05-01T00:00:00Z");
    expect(out["@id"]).toBe("https://thulanimaseko.com/blog/hello#blogposting");
  });

  it("buildBlogPosting — only emits optional fields when provided", () => {
    const minimal = buildBlogPosting({
      slug: "a",
      headline: "A",
      description: "d",
      datePublished: "2026-05-01T00:00:00Z",
      image: "https://thulanimaseko.com/og/a.png",
    });
    expect(minimal.wordCount).toBeUndefined();
    expect(minimal.keywords).toBeUndefined();

    const rich = buildBlogPosting({
      slug: "a",
      headline: "A",
      description: "d",
      datePublished: "2026-05-01T00:00:00Z",
      image: "https://thulanimaseko.com/og/a.png",
      wordCount: 1500,
      keywords: ["kubernetes", "argocd"],
    });
    expect(rich.wordCount).toBe(1500);
    expect(rich.keywords).toBe("kubernetes, argocd");
  });

  it("buildCreativeWork — declares both CreativeWork + SoftwareSourceCode types", () => {
    const out = buildCreativeWork({
      slug: "homelab",
      name: "Homelab",
      description: "d",
      programmingLanguages: ["TypeScript", "Go"],
    });
    expect(out["@type"]).toEqual(["CreativeWork", "SoftwareSourceCode"]);
    expect(out.programmingLanguage).toEqual(["TypeScript", "Go"]);
  });

  it("buildFaqPage — wraps entries as Question + Answer pairs", () => {
    const out = buildFaqPage([
      { question: "What rate?", answer: "R900/h" },
      { question: "Where?", answer: "Gauteng" },
    ]);
    const entities = out.mainEntity as Array<{
      "@type": string;
      acceptedAnswer: { "@type": string };
    }>;
    expect(entities).toHaveLength(2);
    expect(entities[0]["@type"]).toBe("Question");
    expect(entities[0].acceptedAnswer["@type"]).toBe("Answer");
  });

  it("buildSpeakableArticle — defaults to a sensible CSS selector set", () => {
    const out = buildSpeakableArticle({
      slug: "about",
      headline: "About",
      description: "d",
    });
    const speakable = out.speakable as { cssSelector: string[] };
    expect(speakable.cssSelector).toContain("h1");
    expect(speakable.cssSelector).toContain("[data-speakable]");
  });
});
