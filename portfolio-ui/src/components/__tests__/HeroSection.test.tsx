import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { personalData } from "@/data/personal";

// Mock AuroraBackground — uses WebGL which jsdom cannot handle
vi.mock("@/components/AuroraBackground", () => ({
  AuroraBackground: () => <div data-testid="aurora-background" />,
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
    </ThemeProvider>
  );
}

describe("HeroSection", () => {
  it("renders the user's name", () => {
    renderHeroSection();
    expect(screen.getByText(personalData.name)).toBeInTheDocument();
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

  it('renders "View My Work" button', () => {
    renderHeroSection();
    expect(screen.getByText("View My Work")).toBeInTheDocument();
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

  it("renders metric labels", () => {
    renderHeroSection();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    // UI now uses abbreviated label "Years Exp." instead of "Experience"
    expect(screen.getByText(/Years Exp\.?/i)).toBeInTheDocument();
    expect(screen.getByText("Clients")).toBeInTheDocument();
  });

  it("renders profile image with correct alt text", () => {
    renderHeroSection();
    // alt is "${name} profile photo" — assert with a partial regex match.
    const profileImage = screen.getByAltText(new RegExp(personalData.name, "i"));
    expect(profileImage).toBeInTheDocument();
    expect(profileImage.tagName).toBe("IMG");
  });
});
