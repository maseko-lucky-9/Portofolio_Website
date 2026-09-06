import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Navbar } from "@/components/Navbar";

vi.mock("@/lib/scroll-to-section", () => ({ scrollToSection: vi.fn() }));

const SECTIONS = ["About", "Skills", "Work", "Experience", "Services"];

describe("Navbar", () => {
  it("renders the brand as a link back to the top", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: /thulani/i })).toHaveAttribute("href", "#main");
  });

  it("renders the five section controls", () => {
    render(<Navbar />);
    for (const label of SECTIONS) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("renders the contact CTA", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: /get in touch/i })).toHaveAttribute("href", "#contact");
  });

  // Dark-only: the toggle, its dropdown and the mobile drawer are all gone.
  it("has no theme toggle and no mobile drawer", () => {
    render(<Navbar />);
    expect(screen.queryByRole("button", { name: /toggle theme/i })).toBeNull();
    expect(screen.queryByTestId("mobile-drawer")).toBeNull();
    expect(screen.queryByRole("button", { name: /open menu/i })).toBeNull();
  });
});
