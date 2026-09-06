import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ServicesSection } from "@/components/ServicesSection";
import { services } from "@/data/services";

vi.mock("@/lib/scroll-to-section", () => ({ scrollToSection: vi.fn() }));

describe("ServicesSection", () => {
  it("renders one card per engagement type", () => {
    const { container } = render(<ServicesSection />);
    expect(container.querySelectorAll(".cap")).toHaveLength(services.length);
  });

  it("renders each engagement's name, eyebrow and capability lines", () => {
    render(<ServicesSection />);
    for (const s of services) {
      const heading = screen.getByRole("heading", { level: 3, name: s.name });
      expect(heading).toHaveAttribute("id", `service-${s.id}-heading`);
      expect(screen.getByText(s.eyebrow)).toBeInTheDocument();
      for (const cap of s.caps) {
        expect(screen.getByText(cap)).toBeInTheDocument();
      }
    }
  });

  // The middle card is raised for composition. It must not read as a
  // recommended tier — there are no prices here to rank.
  it("raises the middle card without claiming it is preferred", () => {
    const { container } = render(<ServicesSection />);
    const lifted = container.querySelectorAll(".cap-lift");
    expect(lifted).toHaveLength(1);
    expect(lifted[0].textContent).toContain(services[1].name);
    expect(container.textContent).not.toMatch(/popular|recommended|best value/i);
  });

  it("closes with a link into the FAQ", () => {
    render(<ServicesSection />);
    expect(screen.getByRole("link", { name: /How an engagement starts/ })).toHaveAttribute(
      "href",
      "#how",
    );
  });
});
