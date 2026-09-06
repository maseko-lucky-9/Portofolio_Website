import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ContactSection } from "@/components/ContactSection";
import { personalData } from "@/data/personal";

describe("ContactSection", () => {
  // src/chat.ts quotes this string verbatim and refuses to state availability
  // beyond it, so if it stops appearing on the page the bot and the site
  // disagree about the single highest-intent recruiter question.
  it("states the full sourced availability line", () => {
    render(<ContactSection />);
    expect(screen.getByText(personalData.availability)).toBeInTheDocument();
  });

  it("offers exactly three direct channels", () => {
    const { container } = render(<ContactSection />);
    expect(container.querySelectorAll(".slab-card")).toHaveLength(3);
  });

  it("links email, LinkedIn and GitHub to their real destinations", () => {
    render(<ContactSection />);
    expect(screen.getByRole("link", { name: "Email" })).toHaveAttribute(
      "href",
      `mailto:${personalData.email}`,
    );
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      personalData.social.linkedin,
    );
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      personalData.social.github,
    );
  });

  // Production has no backend, so a form here would collect nothing.
  it("renders no form", () => {
    const { container } = render(<ContactSection />);
    expect(container.querySelector("form")).toBeNull();
    expect(container.querySelector("input")).toBeNull();
  });
});
