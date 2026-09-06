import { describe, it, expect } from "vitest";
import { services } from "@/data/services";
import { faq } from "@/data/faq";

describe("services", () => {
  it("offers exactly three engagement types, in delivery order", () => {
    expect(services.map((s) => s.id)).toEqual(["k8s-ops", "iac", "backend"]);
  });

  it("gives every engagement four capability lines and real tech", () => {
    for (const s of services) {
      expect(s.caps).toHaveLength(4);
      expect(s.caps.every((c) => c.trim().length > 0)).toBe(true);
      expect(s.tech.length).toBeGreaterThan(0);
    }
  });

  // No prices, no tiers, no featured flag: there is no pricing data behind this
  // site, so a hierarchy here would be invented.
  it("carries no commercial hierarchy", () => {
    for (const s of services) {
      expect(Object.keys(s)).toEqual(["id", "eyebrow", "name", "body", "caps", "tech"]);
    }
  });
});

describe("faq", () => {
  it("has four question/answer pairs, each a real question", () => {
    expect(faq).toHaveLength(4);
    for (const item of faq) {
      expect(item.q.endsWith("?")).toBe(true);
      expect(item.a.length).toBeGreaterThan(40);
    }
  });
});
