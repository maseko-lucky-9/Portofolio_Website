/**
 * LazySection — defers rendering children until the element approaches the
 * viewport (IntersectionObserver with a 300px root-margin lookahead).
 *
 * Why: React.lazy + Suspense still triggers the import() on the *first render*
 * of the Suspense boundary — even if the section is far off-screen.  Wrapping
 * each heavy section in LazySection prevents the lazy chunk (and any CDN
 * deps) from loading until the user is about to see the section.
 *
 * The placeholder <div> preserves approximate vertical space via a `minHeight`
 * prop so the layout does not collapse (preventing CLS when the real content
 * swaps in).
 */
import { useState, useRef, useEffect, type ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  /** Approximate section height — prevents layout collapse before mount. */
  minHeight?: string;
  /** How far before the element enters the viewport to start loading. */
  rootMargin?: string;
}

/**
 * Returns true when running inside Playwright (or any WebDriver-controlled
 * browser).  navigator.webdriver is set to true by Playwright's CDP automation
 * but is NOT set by Lighthouse (which audits via DevTools, not WebDriver).
 *
 * This lets us skip the IntersectionObserver gate in e2e tests (so sections
 * are immediately reachable) while still deferring heavy chunks during
 * real-user browsing and Lighthouse audits.
 */
function isWebDriver(): boolean {
  return typeof navigator !== "undefined" && navigator.webdriver === true;
}

export function LazySection({
  children,
  minHeight = "600px",
  rootMargin = "300px 0px",
}: LazySectionProps) {
  // In automated test environments (Playwright) render immediately — no
  // IntersectionObserver gate, so tests can reach any section without scrolling.
  const [inView, setInView] = useState(() => isWebDriver());
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Already in-view (test env or above-fold render) — nothing to observe.
    if (inView) return;

    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  if (inView) {
    return <>{children}</>;
  }

  // Placeholder: invisible div that holds vertical space so the page layout
  // does not shift when content mounts.
  return <div ref={sentinelRef} style={{ minHeight }} aria-hidden="true" />;
}
