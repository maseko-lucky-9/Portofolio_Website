import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExperienceSection } from "../ExperienceSection";

/**
 * Regression cover for the touch tap bug.
 *
 * The cards used onMouseEnter to open and onClick to toggle. A tap synthesises
 * pointerenter/mouseenter *before* click, so the first tap opened the card and
 * the click immediately closed it again — tapping a card appeared to do nothing
 * and only the second tap worked. The handlers are now gated on
 * pointerType === "mouse" so touch reaches onClick alone, while a real mouse on
 * a hybrid device still gets hover-to-open.
 */
function firstCard(): HTMLElement {
  return screen.getAllByRole("button", { name: /Expand details|Collapse details/i })[0];
}

/**
 * One tap, as a browser actually dispatches it: pointerenter *and* the
 * compatibility mouseenter, then click. Firing only pointerenter would make
 * these tests vacuous — the old buggy code listened on onMouseEnter, which
 * React does not synthesise from a pointerenter event.
 */
function tap(el: HTMLElement) {
  fireEvent.pointerEnter(el, { pointerType: "touch" });
  fireEvent.mouseEnter(el);
  fireEvent.click(el);
}

describe("ExperienceSection — pointer handling", () => {
  it("opens on the first tap and does not immediately re-close (touch)", () => {
    render(<ExperienceSection />);
    const card = firstCard();
    expect(card).toHaveAttribute("aria-expanded", "false");

    tap(card);

    expect(card).toHaveAttribute("aria-expanded", "true");
  });

  it("closes on a second tap", () => {
    render(<ExperienceSection />);
    const card = firstCard();

    tap(card);
    expect(card).toHaveAttribute("aria-expanded", "true");

    tap(card);
    expect(card).toHaveAttribute("aria-expanded", "false");
  });

  it("still opens on hover alone for a real mouse", () => {
    render(<ExperienceSection />);
    const card = firstCard();

    fireEvent.pointerEnter(card, { pointerType: "mouse" });

    expect(card).toHaveAttribute("aria-expanded", "true");
  });

  it("ignores pointerleave from touch so a tap-opened card stays open", () => {
    render(<ExperienceSection />);
    const card = firstCard();

    tap(card);
    fireEvent.pointerLeave(card, { pointerType: "touch" });
    fireEvent.mouseLeave(card);

    expect(card).toHaveAttribute("aria-expanded", "true");
  });
});
