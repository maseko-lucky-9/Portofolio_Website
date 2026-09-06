import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { OperatorSection } from "@/components/OperatorSection";
import { personalData } from "@/data/personal";

describe("OperatorSection", () => {
  it("renders the portrait as a real img with alt text", () => {
    const { container } = render(<OperatorSection />);
    const img = screen.getByAltText(new RegExp(personalData.name, "i")) as HTMLImageElement;
    expect(img.tagName).toBe("IMG");
    // <picture> with AVIF/WebP sources — the img is the JPEG fallback.
    expect(container.querySelector("picture source[type='image/avif']")).toBeInTheDocument();
    expect(container.querySelector("picture source[type='image/webp']")).toBeInTheDocument();
  });

  it("carries an explicit intrinsic size so the frame reserves its space", () => {
    render(<OperatorSection />);
    const img = screen.getByAltText(new RegExp(personalData.name, "i"));
    expect(img).toHaveAttribute("width");
    expect(img).toHaveAttribute("height");
  });

  it("renders the two-tone heading and links it to the section", () => {
    const { container } = render(<OperatorSection />);
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2.textContent).toContain("Most platform work fails in production");
    expect(container.querySelector("section#operator")).toHaveAttribute("aria-labelledby", h2.id);
  });

  it("states the certification and location as sourced credentials", () => {
    render(<OperatorSection />);
    expect(screen.getByText(/Azure Developer Associate/)).toBeInTheDocument();
    expect(screen.getByText(personalData.location)).toBeInTheDocument();
  });
});
