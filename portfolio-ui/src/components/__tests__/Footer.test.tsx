import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Footer } from "@/components/Footer";
import { personalData } from "@/data/personal";

vi.mock("@/lib/scroll-to-section", () => ({ scrollToSection: vi.fn() }));

describe("Footer", () => {
  it("renders the wordmark and the sourced role title", () => {
    render(<Footer />);
    expect(screen.getAllByText(personalData.name).length).toBeGreaterThan(0);
    // The hero has no title line any more, so this is where it is stated —
    // and src/chat.ts reads the same field.
    expect(screen.getByText(personalData.title)).toBeInTheDocument();
  });

  it("keeps the cross-route content links alive", () => {
    render(<Footer />);
    for (const [name, href] of [
      ["Writing", "/blog"],
      ["Answers", "/answers"],
      ["Case studies", "/projects"],
      ["RSS", "/rss.xml"],
    ]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });

  it("labels the social links for assistive tech", () => {
    render(<Footer />);
    expect(screen.getByLabelText("GitHub")).toHaveAttribute("href", personalData.social.github);
    expect(screen.getByLabelText("LinkedIn")).toHaveAttribute("href", personalData.social.linkedin);
  });

  it("has no empty hrefs", () => {
    const { container } = render(<Footer />);
    for (const a of container.querySelectorAll("a")) {
      expect(a.getAttribute("href")).toBeTruthy();
    }
  });

  it("shows the current year", () => {
    render(<Footer />);
    expect(screen.getByText(new RegExp(`${new Date().getFullYear()}`))).toBeInTheDocument();
  });
});
