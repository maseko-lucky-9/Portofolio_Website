import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { personalData } from "@/data/personal";

// PaperBackground is pure DOM (no WebGL) — but mock to keep test surface
// stable and isolate HeroSection assertions from background rendering.
vi.mock("@/components/PaperBackground", () => ({
  PaperBackground: () => <div data-testid="paper-background" />,
}));

// Mock framer-motion to pass through children without animation
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useReducedMotion: () => false,
  };
});

import { HeroSection } from "../HeroSection";

function renderHeroSection() {
  return render(
    <ThemeProvider>
      <HeroSection />
    </ThemeProvider>,
  );
}

describe("HeroSection", () => {
  it("renders the user's name", () => {
    renderHeroSection();
    // Name is split into multiple spans (first name + underlined surname) so
    // getByText (single text node) no longer matches. Use accessible name
    // composition via heading role.
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: new RegExp(personalData.name),
      }),
    ).toBeInTheDocument();
  });

  it("renders the title", () => {
    renderHeroSection();
    expect(screen.getByText(personalData.title)).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    renderHeroSection();
    expect(screen.getByText(personalData.tagline)).toBeInTheDocument();
  });

  it("has correct GitHub link href", () => {
    renderHeroSection();
    const githubLink = screen.getByLabelText("GitHub");
    expect(githubLink).toHaveAttribute("href", personalData.social.github);
  });

  it("has correct LinkedIn link href", () => {
    renderHeroSection();
    const linkedinLink = screen.getByLabelText("LinkedIn");
    expect(linkedinLink).toHaveAttribute("href", personalData.social.linkedin);
  });

  it("renders projects CTA button", () => {
    renderHeroSection();
    expect(screen.getByText("See what I've built")).toBeInTheDocument();
  });

  it('renders "Contact Me" button', () => {
    renderHeroSection();
    expect(screen.getByText("Contact Me")).toBeInTheDocument();
  });

  it("renders metric cards with correct values", () => {
    renderHeroSection();
    expect(screen.getByText(personalData.metrics.projects)).toBeInTheDocument();
    expect(screen.getByText(personalData.metrics.experience)).toBeInTheDocument();
    expect(screen.getByText(personalData.metrics.clients)).toBeInTheDocument();
  });

  it("renders metric prose in the inline sentence", () => {
    renderHeroSection();
    // Metrics are no longer label/value cards — they're an inline sentence:
    // "Shipped 20+ projects with 10+ clients over 8+ years."
    // The whole sentence is a single accessible <p>; assert the substrings
    // by matching against its text content rather than by individual spans.
    const sentence = screen.getByText(/Shipped[\s\S]+projects[\s\S]+clients[\s\S]+/i);
    expect(sentence).toBeInTheDocument();
  });

  it("renders profile image with correct alt text", () => {
    renderHeroSection();
    // alt is "${name} profile photo" — assert with a partial regex match.
    const profileImage = screen.getByAltText(new RegExp(personalData.name, "i"));
    expect(profileImage).toBeInTheDocument();
    expect(profileImage.tagName).toBe("IMG");
  });
});
