import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { personalData } from "@/data/personal";
import { Footer } from "../Footer";

describe("Footer", () => {
  it("renders copyright with current year", () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
  });

  it("renders brand name", () => {
    render(<Footer />);
    const firstName = personalData.name.split(" ")[0];
    expect(screen.getByText(firstName)).toBeInTheDocument();
    expect(screen.getByText(".dev")).toBeInTheDocument();
  });

  it("renders all 6 navigation links", () => {
    render(<Footer />);
    const expectedLinks = ["About", "Skills", "Projects", "Experience", "Blog", "Contact"];
    expectedLinks.forEach((linkText) => {
      expect(screen.getByText(linkText)).toBeInTheDocument();
    });
  });

  it("renders social links with correct aria-labels", () => {
    render(<Footer />);
    expect(screen.getByLabelText("GitHub")).toBeInTheDocument();
    expect(screen.getByLabelText("LinkedIn")).toBeInTheDocument();
    // Twitter is deliberately absent: personal.ts ships `twitter: ""` and the
    // components filter unset links out, because href="" resolves to the current
    // page rather than being inert. Asserting the absence keeps that intentional.
    expect(screen.queryByLabelText("Twitter")).not.toBeInTheDocument();
  });

  it("social links have correct hrefs", () => {
    render(<Footer />);
    expect(screen.getByLabelText("GitHub")).toHaveAttribute("href", personalData.social.github);
    expect(screen.getByLabelText("LinkedIn")).toHaveAttribute("href", personalData.social.linkedin);
  });

  // Written against the data rather than a hardcoded list, so it keeps holding when
  // twitter/calendar are eventually filled in — and still fails if someone drops the
  // .filter() and reintroduces a link that silently reloads the page.
  it("never renders a social link with an empty href", () => {
    render(<Footer />);
    for (const anchor of screen.getAllByRole("link")) {
      expect(anchor.getAttribute("href")).toBeTruthy();
    }
  });
});
