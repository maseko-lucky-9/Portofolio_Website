import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FaqSection } from "@/components/FaqSection";
import { faq } from "@/data/faq";

describe("FaqSection", () => {
  it("renders every question as a native disclosure", () => {
    const { container } = render(<FaqSection />);
    const rows = container.querySelectorAll("details.acc");
    expect(rows).toHaveLength(faq.length);
    faq.forEach((item, i) => {
      expect(rows[i].querySelector("summary")?.textContent).toContain(item.q);
    });
  });

  // Opening the first row means the section reads as answered content rather
  // than a wall of closed rows, and its answer is in the DOM for find-in-page.
  it("ships the first row open and the rest closed", () => {
    const { container } = render(<FaqSection />);
    const rows = [...container.querySelectorAll("details.acc")];
    expect(rows[0]).toHaveAttribute("open");
    rows.slice(1).forEach((r) => expect(r).not.toHaveAttribute("open"));
  });

  it("labels the section by its heading", () => {
    const { container } = render(<FaqSection />);
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(container.querySelector("section")).toHaveAttribute("aria-labelledby", h2.id);
  });
});
