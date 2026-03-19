import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { personalData } from "@/data/personal";

// Mock framer-motion to pass through children
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
  };
});

import { Navbar } from "../Navbar";

function renderNavbar() {
  return render(
    <ThemeProvider>
      <Navbar />
    </ThemeProvider>
  );
}

describe("Navbar", () => {
  it("renders all 6 navigation links", () => {
    renderNavbar();
    const expectedLinks = ["About", "Skills", "Projects", "Experience", "Blog", "Contact"];

    expectedLinks.forEach((linkText) => {
      const buttons = screen.getAllByText(linkText);
      // At least one instance should exist (desktop nav + possibly mobile nav)
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders the brand logo with first name", () => {
    renderNavbar();
    const firstName = personalData.name.split(" ")[0];
    expect(screen.getByText(firstName)).toBeInTheDocument();
  });

  it("renders the .dev suffix in brand", () => {
    renderNavbar();
    expect(screen.getByText(".dev")).toBeInTheDocument();
  });

  it("has a theme toggle button", () => {
    renderNavbar();
    expect(screen.getByText("Toggle theme")).toBeInTheDocument();
  });

  it("has a mobile menu button", () => {
    renderNavbar();
    // The mobile menu button is a Button with variant="ghost" and size="icon"
    // It contains either a Menu or X icon. It's the md:hidden button.
    const buttons = screen.getAllByRole("button");
    // At least the theme toggle button and mobile menu button should exist
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});
