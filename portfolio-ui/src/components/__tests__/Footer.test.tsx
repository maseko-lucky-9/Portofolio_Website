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
    expect(screen.getByLabelText("Twitter")).toBeInTheDocument();
  });

  it("social links have correct hrefs", () => {
    render(<Footer />);
    expect(screen.getByLabelText("GitHub")).toHaveAttribute("href", personalData.social.github);
    expect(screen.getByLabelText("LinkedIn")).toHaveAttribute("href", personalData.social.linkedin);
    expect(screen.getByLabelText("Twitter")).toHaveAttribute("href", personalData.social.twitter);
  });
});
