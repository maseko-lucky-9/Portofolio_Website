import { useMemo, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { useFeaturedProjects } from "@/hooks/use-projects";
import { projects as staticProjects } from "@/data/projects";
import { env } from "@/config/env";
import type { Project as ApiProject } from "@/types/api";
import { useReducedMotion } from "@/lib/motion";
import { revealOnScroll, useAnime } from "@/lib/use-anime";
import { useSpotlight } from "@/lib/use-spotlight";

interface DisplayProject {
  id: string;
  title: string;
  tagline: string;
  description: string;
  technologies: string[];
  impact?: string;
  githubUrl?: string;
}

function mapApiProject(project: ApiProject): DisplayProject {
  return {
    id: project.id,
    title: project.title,
    tagline: project.subtitle || "",
    description: project.excerpt || project.description,
    technologies: project.techStack,
    impact: undefined,
    githubUrl: project.githubUrl || undefined,
  };
}

/**
 * Selected work — a stack of wide showcase panels, split copy | impact.
 *
 * No technology filter any more. Four projects do not need faceting; the chips
 * were a control that mostly demonstrated it could be clicked, and removing it
 * takes the exit/enter swap choreography with it.
 *
 * The API path and its static fallback are unchanged: production builds with
 * VITE_USE_API=false and renders `staticProjects`, which is the source of truth
 * for the impact lines (projects.ts requires every URL to resolve and every
 * impact claim to be supported by the repo's README).
 */
export function ProjectsSection() {
  const prefersReducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  useSpotlight(rootRef, ".panel");

  const { data: apiResponse, isError, refetch } = useFeaturedProjects(6);

  const projects: DisplayProject[] = useMemo(() => {
    if (!env.useApi && !apiResponse) return staticProjects;
    if (apiResponse?.data) {
      const apiData = Array.isArray(apiResponse.data) ? apiResponse.data : [apiResponse.data];
      return apiData.map(mapApiProject);
    }
    return staticProjects;
  }, [apiResponse]);

  useAnime(
    rootRef,
    (scope) => {
      const root = rootRef.current;
      if (!root) return;
      if (scope.matches.reducedMotion) return;
      return revealOnScroll(root, "[data-anime-card]", { staggerMs: 90 });
    },
    [projects.length],
  );

  return (
    <section
      ref={rootRef}
      // No id — the LazySection wrapper in Index.tsx owns `#work`.
      aria-labelledby="work-heading"
      className="s-blur-xl"
    >
      <div className="wrap">
        <div style={{ marginBottom: 80, maxWidth: "52rem" }}>
          <p className="eyebrow mono" style={{ marginBottom: 20 }}>
            <span className="dot">
              <i className="halo" />
              <i />
            </span>
            Selected work
          </p>
          <h2 id="work-heading" className="display">
            Four repositories, <span className="fade">all of them public.</span>
          </h2>
          <p className="lede" style={{ marginTop: 24 }}>
            Every URL below resolves, and each impact line describes only what the
            repository&rsquo;s README supports.
          </p>
        </div>

        {isError && env.useApi && (
          <div
            className="small"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 32,
              padding: 12,
              borderRadius: "var(--r-md)",
              background: "oklch(var(--destructive) / 0.1)",
              color: "oklch(var(--destructive))",
            }}
          >
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            <span>Unable to load latest projects.</span>
            <button
              type="button"
              onClick={() => refetch()}
              style={{ textDecoration: "underline", fontWeight: 500 }}
            >
              Retry
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {projects.map((project, i) => (
            <article
              key={project.id}
              data-anime-card
              className="panel spot"
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                borderRadius: "var(--r-xl)",
                opacity: prefersReducedMotion ? 1 : undefined,
              }}
            >
              <div className="show-split" style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    padding: 32,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <p className="mono tiny on">
                    {String(i + 1).padStart(2, "0")} &nbsp;/&nbsp; {project.tagline}
                  </p>
                  <h3 className="display" style={{ fontSize: "var(--t-3xl)" }}>
                    {project.title}
                  </h3>
                  <p className="small" style={{ color: "var(--ink-70)" }}>
                    {project.description}
                  </p>
                  {project.githubUrl && (
                    <a
                      className="btn btn-ghost"
                      style={{ alignSelf: "flex-start", marginTop: 8 }}
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View repository
                      <span className="arw" aria-hidden="true">
                        &#8599;
                      </span>
                    </a>
                  )}
                </div>

                <div
                  style={{
                    padding: 32,
                    background: "var(--veil-02)",
                    borderTop: "1px solid var(--border-section)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    justifyContent: "center",
                  }}
                >
                  <p className="mono tiny">Impact</p>
                  <p className="small" style={{ color: "var(--ink-70)" }}>
                    {project.impact}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {project.technologies.slice(0, 8).map((tech) => (
                      <span key={tech} className="chip">
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 8 && (
                      <span className="chip">+{project.technologies.length - 8}</span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
