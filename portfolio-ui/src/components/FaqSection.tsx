import { useRef } from "react";
import { faq } from "@/data/faq";
import { revealOnScroll, useAnime } from "@/lib/use-anime";

/**
 * How an engagement works.
 *
 * Native <details>/<summary>: the disclosure behaviour, keyboard support and
 * find-in-page all come from the platform, so there is no open state to hold,
 * no aria to wire, and it works before hydration. The first row ships open so
 * the section reads as answered content rather than a wall of closed rows.
 */
export function FaqSection() {
  const rootRef = useRef<HTMLElement>(null);

  useAnime(
    rootRef,
    (scope) => {
      const root = rootRef.current;
      if (!root) return;
      if (scope.matches.reducedMotion) return;
      return revealOnScroll(root, "[data-anime]", { staggerMs: 80 });
    },
    [],
  );

  return (
    <section
      ref={rootRef}
      // No id — the LazySection wrapper in Index.tsx owns `#how`.
      aria-labelledby="how-heading"
      className="s-80"
    >
      <div className="wrap">
        <div className="sec-head asym" data-anime>
          <div>
            <p className="eyebrow mono" style={{ marginBottom: 20 }}>
              <span className="dot">
                <i className="halo" />
                <i />
              </span>
              How it works
            </p>
            <p className="body">
              The questions that come up before an engagement starts, answered before you have to
              ask them.
            </p>
          </div>
          <div className="right">
            <h2 id="how-heading" className="display">
              Engagement, <span className="fade">decoded.</span>
            </h2>
          </div>
        </div>

        {faq.map((item, i) => (
          <details className="acc" key={item.q} open={i === 0} data-anime>
            <summary>
              <h3 className="display" style={{ fontSize: "var(--t-xl)" }}>
                {item.q}
              </h3>
              <span className="plus" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </summary>
            <div className="ans">
              <p className="body">{item.a}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
