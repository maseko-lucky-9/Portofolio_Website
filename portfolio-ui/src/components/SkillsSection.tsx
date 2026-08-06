import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { Code2, Server, Cloud } from "lucide-react";
import { skills, radarSkills, SkillCategory } from "@/data/skills";
import { SkillsRadar } from "@/components/SkillsRadar";

import { DURATION, EASE_FN, springAnimeSkills, useReducedMotion } from "@/lib/motion";
import { revealOnScroll, useAnime } from "@/lib/use-anime";

const categoryIcons = {
  frontend: Code2,
  backend: Server,
  devops: Cloud,
};

// Per-category accent, restored from 4aaa2de. Drives the active toggle,
// the radar, both column rules and the skill bars, so switching category
// repaints the whole section.
//
// Frontend/backend reuse --primary/--secondary rather than minting their
// own tokens — that keeps the backend green identical to the hero
// availability badge and the Experience bullets. Only the devops purple
// needs a token. All three are theme-aware and every fill clears WCAG AA
// against an oklch(var(--background)) label (dark 4.65 / 9.65 / 5.26 —
// light 5.65 / 5.41 / 6.23).
const categoryColors: Record<SkillCategory, string> = {
  frontend: "oklch(var(--primary))",
  backend: "oklch(var(--secondary))",
  devops: "oklch(var(--cat-devops))",
};

// Same hues at 0.33 alpha for the active toggle's cast glow.
const categoryGlows: Record<SkillCategory, string> = {
  frontend: "0 4px 20px oklch(var(--primary) / 0.33)",
  backend: "0 4px 20px oklch(var(--secondary) / 0.33)",
  devops: "0 4px 20px oklch(var(--cat-devops) / 0.33)",
};

export function SkillsSection() {
  const [activeCategory, setActiveCategory] = useState<SkillCategory>("frontend");
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
      className="py-20 md:py-28 relative overflow-hidden"
      style={{ background: "oklch(var(--muted) / var(--opacity-soft))" }}
    >
      {/* Subtle top gradient fade */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(var(--primary) / 0.25), transparent)",
        }}
      />

      <div className="section-container !py-0 py-20 md:py-28">
        {/* Section header */}
        <div data-anime-section className="text-center mb-14">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
            Expertise
          </span>
          <h2 id="skills-heading" className="section-title">
            Skills &amp; Expertise
          </h2>
          <p className="section-subtitle mx-auto">
            A T-shaped developer with deep expertise in specific areas and broad knowledge across
            the stack.
          </p>
        </div>

        {/* Category toggle */}
        <div data-anime-section className="flex justify-center gap-3 mb-14 flex-wrap">
          {(["frontend", "backend", "devops"] as SkillCategory[]).map((category) => {
            const Icon = categoryIcons[category];
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                // data-active is retained as the stable e2e/visual selector.
                // The active fill is driven from style (not data-[active]
                // utilities) because the colour varies per category; the hover
                // rule is scoped to inactive so it cannot draw a foreground
                // border across an active fill.
                data-active={isActive ? "true" : "false"}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all
                           bg-card text-foreground border border-border
                           data-[active=false]:hover:border-foreground/30"
                style={{
                  transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
                  ...(isActive
                    ? {
                        background: categoryColors[category],
                        color: "oklch(var(--background))",
                        borderColor: categoryColors[category],
                        boxShadow: categoryGlows[category],
                      }
                    : { boxShadow: "var(--shadow-sm)" }),
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="capitalize">{category}</span>
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Radar chart column */}
          <div data-anime-section className="skill-radar-container">
            <div className="flex items-center gap-2 mb-6">
              <div
                className="w-2 h-6 rounded-full"
                style={{ background: categoryColors[displayed] }}
              />
              <h3 className="text-base font-semibold capitalize">{displayed} Radar</h3>
            </div>
            <div className="h-64 sm:h-80 flex items-center justify-center">
              <SkillsRadar data={currentRadarData} color={categoryColors[displayed]} />
            </div>
          </div>

          {/* Skills list column */}
          <div data-anime-section>
            <div className="flex items-center gap-2 mb-6">
              <div
                className="w-2 h-6 rounded-full"
                style={{ background: categoryColors[displayed] }}
              />
              <h3 className="text-base font-semibold">Technologies &amp; Tools</h3>
            </div>
            {/* Category-swap container. The skill rows + bars are keyed off
                `displayed`, which lags `activeCategory` while the exit
                animation plays — see the useEffect above. */}
            <div ref={listRef} className="space-y-5" style={{ opacity: 0 }}>
              {filteredSkills.map((skill) => (
                <div key={skill.name} data-anime-skill>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-semibold text-foreground">{skill.name}</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                        style={{
                          background: "oklch(var(--accent))",
                          color: "oklch(var(--accent-foreground))",
                        }}
                      >
                        {skill.type}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {getProficiencyLabel(skill.proficiency)}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden relative"
                    style={{ background: "oklch(var(--muted))" }}
                  >
                    <div
                      data-anime-bar
                      className="h-full rounded-full"
                      style={{
                        width: `${skill.proficiency}%`,
                        transform: prefersReducedMotion ? "scaleX(1)" : "scaleX(0)",
                        transformOrigin: "left center",
                        background: categoryColors[displayed],
                        willChange: "transform",
                      }}
                    />
                    {!prefersReducedMotion && (
                      <div
                        className="absolute inset-y-0 left-0 pointer-events-none animate-shimmer-once"
                        style={{
                          width: `${skill.proficiency}%`,
                          background:
                            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
                          backgroundSize: "200% 100%",
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subtle bottom border */}
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(var(--primary) / 0.15), transparent)",
        }}
      />
    </section>
  );
}
