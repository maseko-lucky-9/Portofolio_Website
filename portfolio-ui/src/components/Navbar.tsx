import { useRef } from "react";
import { animate, stagger } from "animejs";
import { EASE_FN } from "@/lib/motion";
import { useAnime } from "@/lib/use-anime";
import { scrollToSection } from "@/lib/scroll-to-section";

/** Section order matches the page, so the pill reads as a map of the scroll. */
const navLinks = [
  { href: "#operator", label: "About" },
  { href: "#skills", label: "Skills" },
  { href: "#work", label: "Work" },
  { href: "#experience", label: "Experience" },
  { href: "#services", label: "Services" },
];

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="oklch(var(--signal))" opacity=".5" />
      <path
        d="M6 15.5 18 7.5"
        stroke="oklch(var(--signal))"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The floating nav pill.
 *
 * Below 768px the section links are hidden and the pill collapses to brand +
 * CTA. That is the design's own answer to mobile navigation: with seven
 * scroll-anchors on a single page, a drawer duplicates the scroll rather than
 * adding a way to get anywhere, and the CTA is the only action a recruiter on a
 * phone actually needs.
 *
 * Links are buttons, not anchors, so scrollToSection() can own the offset math
 * and hand the scroll to Lenis. The brand is a real anchor to #main because
 * "back to top" should survive JS being unavailable.
 */
export function Navbar() {
  const headerRef = useRef<HTMLElement>(null);

  useAnime(headerRef, (scope) => {
    if (scope.matches.reducedMotion) return;
    const el = headerRef.current;
    if (!el) return;
    animate(el, {
      translateY: [-80, 0],
      opacity: [0, 1],
      duration: 500,
      ease: EASE_FN.emphasized,
    });
    animate(el.querySelectorAll("[data-anime-link]"), {
      opacity: [0, 1],
      duration: 400,
      delay: stagger(50, { start: 200 }),
      ease: EASE_FN.emphasized,
    });
  });

  return (
    <header className="nav" ref={headerRef}>
      <a className="brand" href="#main">
        <Mark />
        <span className="word">Thulani</span>
      </a>

      <nav className="links" aria-label="Primary">
        {navLinks.map(({ href, label }) => (
          <button key={href} type="button" data-anime-link onClick={() => scrollToSection(href)}>
            {label}
          </button>
        ))}
      </nav>

      <a className="btn btn-light" href="#contact">
        Get in touch
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </header>
  );
}
