import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { Code2, Server, Cloud } from "lucide-react";
import { skills, radarSkills, SkillCategory } from "@/data/skills";
import { SkillsRadar } from "@/components/SkillsRadar";

import { DURATION, EASE_FN, springAnimeSkills, useReducedMotion } from "@/lib/motion";
import { revealOnScroll, useAnime } from "@/lib/use-anime";

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  devops: "DevOps & Cloud",
  backend: "Backend",
  frontend: "Frontend",
};

const categoryIcons = {
  frontend: Code2,
  backend: Server,
  devops: Cloud,
};

// Treatment A: one accent across all three categories.
//
// The previous per-category palette was a deliberate, contrast-measured choice,
// not a regression — but this design spends its single high-chroma colour on
// one signal, and three competing hues in a section that already encodes
// category by position and label is decoration doing a job nothing asked for.
// Category is still switchable; it just no longer changes hue.
//
// The value stays a token indirection rather than a literal so treatments B/C
// remain a token edit, not a component rewrite.
const CATEGORY_TRIPLE = "var(--signal)";
const categoryColors: Record<SkillCategory, string> = {
  frontend: `oklch(${CATEGORY_TRIPLE})`,
  backend: `oklch(${CATEGORY_TRIPLE})`,
  devops: `oklch(${CATEGORY_TRIPLE})`,
};

export function SkillsSection() {
  const [activeCategory, setActiveCategory] = useState<SkillCategory>("devops");
  // `displayed` lags `activeCategory` while the exit animation plays. The
  // list renders against `displayed` so the swap completes cleanly: exit
  // current → setDisplayed → enter new (handled by useAnime keyed on
  // displayed). Matches the previous AnimatePresence mode="wait" semantics.
  const [displayed, setDisplayed] = useState<SkillCategory>(activeCategory);
  const prefersReducedMotion = useReducedMotion();

  const rootRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const currentRadarData = radarSkills[displayed];
  const filteredSkills = skills.filter((skill) => skill.category === displayed);

  const getProficiencyLabel = (value: number) => {
    if (value >= 90) return "Expert";
    if (value >= 75) return "Advanced";
    if (value >= 50) return "Intermediate";
    return "Beginner";
  };

  // Section-level reveals: header, toggle, radar column, skills-list
  // column. Standard scroll-triggered fade-up via revealOnScroll. Runs
  // once per mount.
  useAnime(
    rootRef,
    (scope) => {
      const root = rootRef.current;
      if (!root) return;
      if (scope.matches.reducedMotion) return;
      return revealOnScroll(root, "[data-anime-section]", { staggerMs: 80 });
    },
    [],
  );

  // Category-swap orchestration. When `activeCategory` differs from
  // `displayed`, animate the list out, swap displayed, and let the
  // category-keyed useAnime below play the entrance for the new items.
  useEffect(() => {
    if (activeCategory === displayed) return;
    const el = listRef.current;
    if (!el) {
      setDisplayed(activeCategory);
      return;
    }
    if (prefersReducedMotion) {
      setDisplayed(activeCategory);
      return;
    }
    const exit = animate(el, {
      opacity: [1, 0],
      translateY: [0, -8],
      duration: 180,
      ease: EASE_FN.out,
    });
    let cancelled = false;
    exit.then(() => {
      if (!cancelled) setDisplayed(activeCategory);
    });
    return () => {
      cancelled = true;
      exit.cancel();
    };
  }, [activeCategory, displayed, prefersReducedMotion]);

  // Entrance for the displayed-category skills. Re-runs every time
  // `displayed` changes (after the exit animation completes). Animates
  // each skill row + its progress bar with a small stagger.
  useAnime(
    listRef,
    (scope) => {
      const el = listRef.current;
      if (!el) return;
      if (scope.matches.reducedMotion) {
        el.style.opacity = "1";
        el.style.transform = "none";
        return;
      }
      // Bring the wrapper back to full opacity (in case we just exited).
      const wrapper = animate(el, {
        opacity: [el.style.opacity || "0", 1],
        translateY: [el.style.transform ? -8 : 0, 0],
        duration: 220,
        ease: EASE_FN.emphasized,
      });
      const rows = animate(el.querySelectorAll<HTMLElement>("[data-anime-skill]"), {
        opacity: [0, 1],
        translateX: [16, 0],
        delay: stagger(45),
        duration: 700,
        ease: springAnimeSkills,
      });
      const bars = animate(el.querySelectorAll<HTMLElement>("[data-anime-bar]"), {
        scaleX: [0, 1],
        delay: stagger(40, { start: 200 }),
        duration: DURATION.slow * 1000,
        ease: EASE_FN.spring,
      });
      return () => {
        wrapper.cancel();
        rows.cancel();
        bars.cancel();
      };
    },
    [displayed],
  );

  return (
    <section
      ref={rootRef}
      // No id: the LazySection wrapper in Index.tsx owns `#skills` as the
      // anchor target, because it exists before this section mounts and
      // survives the Suspense fallback. Carrying it here too would put two
      // elements with the same id in the document — invalid HTML, and `#skills`
      // would resolve to the wrapper, hiding this landmark's label from
      // tooling. The heading association below is what matters here.
      aria-labelledby="skills-heading"
      className="s-50"
      // --cat is what the CSS reads for the active toggle fill, the column
      // rules and the bar fills, so one property repaints the whole section.
      style={{ "--cat": CATEGORY_TRIPLE } as React.CSSProperties}
    >
      <div className="wrap">
        <div className="text-center" style={{ marginBottom: 56 }}>
          <p className="eyebrow mono mb-4" style={{ justifyContent: "center" }} data-anime-section>
            <span className="dot">
              <i className="halo" />
              <i />
            </span>
            Expertise
          </p>
          <h2 id="skills-heading" className="display" data-anime-section>
            Skills &amp; <span className="fade">expertise.</span>
          </h2>
          <p
            className="lede"
            style={{ margin: "24px auto 0", textAlign: "center" }}
            data-anime-section
          >
            A T-shaped developer: deep in Kubernetes and .NET, broad across the delivery path around
            them.
          </p>
        </div>

        <div className="sk-toggles" data-anime-section>
          {(["devops", "backend", "frontend"] as SkillCategory[]).map((category) => {
            const Icon = categoryIcons[category];
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                // data-active is retained as the stable e2e/visual selector.
                data-active={isActive ? "true" : "false"}
                className="sk-toggle"
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{CATEGORY_LABELS[category]}</span>
              </button>
            );
          })}
        </div>

        <div className="sk-grid">
          <div data-anime-section>
            <div className="sk-head">
              <span className="bar" />
              <h3>{CATEGORY_LABELS[displayed]} radar</h3>
            </div>
            <div className="sk-panel" style={{ aspectRatio: "11 / 8" }}>
              <SkillsRadar data={currentRadarData} color={categoryColors[displayed]} />
            </div>
          </div>

          <div data-anime-section>
            <div className="sk-head">
              <span className="bar" />
              <h3>Technologies &amp; tools</h3>
            </div>
            {/* Category-swap container. The skill rows + bars are keyed off
                `displayed`, which lags `activeCategory` while the exit
                animation plays — see the useEffect above. */}
            <div ref={listRef} className="sk-list" style={{ opacity: 0 }}>
              {filteredSkills.map((skill) => (
                <div key={skill.name} data-anime-skill>
                  <div className="sk-row-top">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        minWidth: 0,
                      }}
                    >
                      <span className="sk-name">{skill.name}</span>
                      <span className="chip">{skill.type}</span>
                    </div>
                    <span className="mono tiny">{getProficiencyLabel(skill.proficiency)}</span>
                  </div>
                  <div className="sk-track">
                    <div
                      data-anime-bar
                      className="sk-fill"
                      style={{
                        width: `${skill.proficiency}%`,
                        transform: prefersReducedMotion ? "scaleX(1)" : "scaleX(0)",
                        willChange: "transform",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
