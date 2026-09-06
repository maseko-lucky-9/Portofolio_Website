import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TrustStrip, TRUST_BADGE } from "@/components/TrustStrip";

function itemsOfFirstSet(container: HTMLElement) {
  const first = container.querySelector(".mq-set") as HTMLElement;
  return [...first.querySelectorAll(".mq-item")].map((n) => n.textContent?.trim());
}

describe("TrustStrip", () => {
  it("renders two marquee sets so the -50% loop is seamless", () => {
    const { container } = render(<TrustStrip />);
    const sets = container.querySelectorAll(".mq-set");
    expect(sets).toHaveLength(2);
    // The duplicate is decorative — screen readers must hear each employer once.
    expect(sets[1]).toHaveAttribute("aria-hidden", "true");
  });

  // Pinned to the literal list rather than re-deriving it from the data module:
  // asserting against the same transformation the component runs proves nothing.
  it("lists the employers in career order", () => {
    const { container } = render(<TrustStrip />);
    expect(itemsOfFirstSet(container)).toEqual([
      "Capitec Bank",
      "Invoke Solutions",
      "E4 Strategic",
      "Absa",
      "The Digital Academy",
    ]);
  });

  it("carries the sourced credential badge", () => {
    const { container } = render(<TrustStrip />);
    // Matched on textContent, not a RegExp built from the constant: the badge
    // starts "8+", and `+` is a quantifier — /8+ years/ matches "8 years" and
    // would pass against a weaker claim than the one we make.
    const badge = container.querySelector(".mq-badge") as HTMLElement;
    expect(badge.textContent).toContain(TRUST_BADGE);
    expect(screen.getByText(TRUST_BADGE, { exact: false })).toBeInTheDocument();
  });
});

// The real data happens to have five distinct employers, so the dedup below is
// unreachable with it — and a test using that data cannot tell whether dedup
// works. A returning employer is an ordinary career shape, and two identical
// names sliding past each other reads as a rendering fault, so it is worth both
// the Set and a test that actually reaches it.
describe("TrustStrip with a repeat employer", () => {
  it("shows each employer once, at its first appearance", async () => {
    vi.resetModules();
    vi.doMock("@/data/experience", () => ({
      experiences: [{ company: "Capitec Bank" }, { company: "Absa" }, { company: "Capitec Bank" }],
    }));
    const { TrustStrip: Fresh } = await import("@/components/TrustStrip");
    const { container } = render(<Fresh />);
    expect(itemsOfFirstSet(container)).toEqual(["Capitec Bank", "Absa"]);
    vi.doUnmock("@/data/experience");
  });
});
