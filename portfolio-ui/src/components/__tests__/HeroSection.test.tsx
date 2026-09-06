import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HeroSection } from "@/components/HeroSection";
import { personalData } from "@/data/personal";

vi.mock("@/lib/scroll-to-section", () => ({ scrollToSection: vi.fn() }));

describe("HeroSection", () => {
  it("renders the two-tone display headline as the h1", () => {
    render(<HeroSection />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveAttribute("id", "hero-heading");
    expect(h1.textContent).toBe("Kubernetes platformsfor South Africanbanking.");
  });

  it("renders the sourced tagline as the lede", () => {
    render(<HeroSection />);
    expect(screen.getByText(personalData.tagline)).toBeInTheDocument();
  });

  it("renders both CTAs pointing at real sections", () => {
    render(<HeroSection />);
    expect(screen.getByRole("link", { name: "View the work" })).toHaveAttribute("href", "#work");
    expect(screen.getByRole("link", { name: /get in touch/i })).toHaveAttribute("href", "#contact");
  });

  it("renders all three metrics with their labels", () => {
    const { container } = render(<HeroSection />);
    const metrics = container.querySelector(".metrics") as HTMLElement;
    expect(metrics).toBeInTheDocument();
    for (const v of Object.values(personalData.metrics)) {
      expect(metrics.textContent).toContain(v);
    }
    for (const label of ["Projects", "Experience", "Certifications"]) {
      expect(metrics.textContent).toContain(label);
    }
  });

  // The photograph moved to #operator. The hero's right column is the
  // instrument diagram, which is decorative and must not be exposed to AT.
  it("has no image, and the instrument is hidden from assistive tech", () => {
    const { container } = render(<HeroSection />);
    expect(container.querySelector("img")).toBeNull();
    const svg = container.querySelector(".instrument svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("labels its section for the accessibility tree", () => {
    const { container } = render(<HeroSection />);
    const section = container.querySelector("section#hero");
    expect(section).toHaveAttribute("aria-labelledby", "hero-heading");
  });
});
