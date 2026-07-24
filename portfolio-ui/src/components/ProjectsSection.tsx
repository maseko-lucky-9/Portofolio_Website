import { useEffect, useMemo, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { ExternalLink, Github, ChevronRight, AlertCircle, FolderOpen } from "lucide-react";
import { useFeaturedProjects } from "@/hooks/use-projects";
import { projects as staticProjects, allTechnologies as staticTechnologies } from "@/data/projects";
import { env } from "@/config/env";
import { Skeleton } from "@/components/ui/skeleton";
import type { Project as ApiProject } from "@/types/api";

import { springAnimeDefault, useReducedMotion } from "@/lib/motion";
import { revealOnScroll, useAnime } from "@/lib/use-anime";

// Map API Project to the shape the template expects
interface DisplayProject {
  id: string;
  title: string;
  tagline: string;
  description: string;
  thumbnail: string;
  technologies: string[];
  challenge?: string;
  solution?: string;
  impact?: string;
  liveUrl?: string;
  githubUrl?: string;
  caseStudyUrl?: string;
  featured: boolean;
}

function mapApiProject(project: ApiProject): DisplayProject {
  return {
    id: project.id,
    title: project.title,
    tagline: project.subtitle || "",
    description: project.excerpt || project.description,
    thumbnail: project.thumbnail || "https://placehold.co/600x400/1e293b/94a3b8?text=Project",
    technologies: project.techStack,
    challenge: undefined,
    solution: undefined,
    impact: undefined,
    liveUrl: project.liveUrl || undefined,
    githubUrl: project.githubUrl || undefined,
    caseStudyUrl: undefined,
    featured: project.featured,
  };
}

function ProjectCardSkeleton() {
  return (
    <div className="card-project">
      <Skeleton className="h-48 w-full rounded-t-xl rounded-b-none" />
      <div className="p-6 space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-12 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <div className="space-y-2 pt-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  );
}

export function ProjectsSection() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const rootRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Fetch from API if enabled, otherwise use static data
  const { data: apiResponse, isLoading, isError, refetch } = useFeaturedProjects(6);

  const projects: DisplayProject[] = useMemo(() => {
    if (!env.useApi && !apiResponse) return staticProjects;
    if (apiResponse?.data) {
      const apiData = Array.isArray(apiResponse.data) ? apiResponse.data : [apiResponse.data];
      return apiData.map(mapApiProject);
    }
    return staticProjects;
  }, [apiResponse]);

  const allTechnologies = useMemo(() => {
    if (!env.useApi && !apiResponse) return staticTechnologies;
    return [...new Set(projects.flatMap((p) => p.technologies))].sort();
  }, [projects, apiResponse]);

  const filteredProjects = useMemo(
    () => (activeFilter ? projects.filter((p) => p.technologies.includes(activeFilter)) : projects),
    [projects, activeFilter],
  );

  // `displayed` lags `filteredProjects` while the exit animation plays.
  // Match the AnimatePresence mode="popLayout" semantics without using
  // anime.js createLayout (which has React-commit timing issues): cards
  // animate out, list swaps, new cards animate in. Less true-FLIP than
  // the original (which inter-card translated), but visually similar
  // since the grid lattice is uniform.
  const [displayed, setDisplayed] = useState<DisplayProject[]>(filteredProjects);

  // Header + filter row scroll reveal (section-level entrance).
  useAnime(
    rootRef,
    (scope) => {
      const root = rootRef.current;
      if (!root) return;
      if (scope.matches.reducedMotion) return;
      return revealOnScroll(root, "[data-anime-section]", { staggerMs: 90 });
    },
    [],
  );

  // Filter change orchestrator: exit current cards, then setDisplayed.
  useEffect(() => {
    if (sameIds(filteredProjects, displayed)) return;
    const grid = gridRef.current;
    if (!grid || prefersReducedMotion) {
      setDisplayed(filteredProjects);
      return;
    }
    const cards = grid.querySelectorAll<HTMLElement>("[data-anime-card]");
    if (cards.length === 0) {
      setDisplayed(filteredProjects);
      return;
    }
    const exit = animate(cards, {
      opacity: [1, 0],
      scale: [1, 0.92],
      duration: 200,
      delay: stagger(30),
    });
    let cancelled = false;
    exit.then(() => {
      if (!cancelled) setDisplayed(filteredProjects);
    });
    return () => {
      cancelled = true;
      exit.cancel();
    };
  }, [filteredProjects, displayed, prefersReducedMotion]);

  // Grid entrance: fires on mount and every time `displayed` swaps.
  // Each card stagger-fades up.
  useAnime(
    gridRef,
    (scope) => {
      const grid = gridRef.current;
      if (!grid) return;
      if (scope.matches.reducedMotion) {
        // Reduced-motion: leave cards at full opacity / no transform.
        grid.querySelectorAll<HTMLElement>("[data-anime-card]").forEach((el) => {
          el.style.opacity = "1";
          el.style.transform = "none";
        });
        return;
      }
      const cards = grid.querySelectorAll<HTMLElement>("[data-anime-card]");
      if (cards.length === 0) return;
      const anim = animate(cards, {
        opacity: [0, 1],
        scale: [0.92, 1],
        duration: 500,
        delay: stagger(80),
        ease: springAnimeDefault,
      });
      return () => anim.cancel();
    },
    [displayed],
  );

  return (
    <section
      ref={rootRef}
      id="projects"
      aria-labelledby="projects-heading"
      className="py-20 section-mesh"
    >
      <div className="section-container">
        {/* Section Header */}
        <div data-anime-section className="text-center mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
            Portfolio
          </span>
          <h2 id="projects-heading" className="section-title">
            Featured Projects
          </h2>
          <p className="section-subtitle mx-auto">
            Things I&apos;ve shipped to production — banking, infra, internal platforms.
          </p>
        </div>

        {/* Technology Filters */}
        {!isLoading && (
          <div data-anime-section className="flex flex-wrap justify-center gap-2 mb-12">
            <button
              onClick={() => setActiveFilter(null)}
              className={`tech-badge ${
                activeFilter === null ? "bg-primary text-primary-foreground" : ""
              }`}
            >
              All
            </button>
            {allTechnologies.slice(0, 10).map((tech) => (
              <button
                key={tech}
                onClick={() => setActiveFilter(activeFilter === tech ? null : tech)}
                className={`tech-badge ${
                  activeFilter === tech ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {tech}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State — show inline warning + fallback data */}
        {isError && env.useApi && (
          <div className="flex items-center justify-center gap-2 mb-8 p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-in fade-in duration-300">
            <AlertCircle className="w-4 h-4" />
            <span>Unable to load latest projects.</span>
            <button onClick={() => refetch()} className="underline font-medium hover:no-underline">
              Retry
            </button>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && displayed.length > 0 && (
          <div ref={gridRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {displayed.map((project) => (
              <article
                key={project.id}
                data-anime-card
                className="card-project group"
                style={{ opacity: prefersReducedMotion ? 1 : 0 }}
              >
                {/* Thumbnail */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    loading="lazy"
                    width={600}
                    height={400}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      // ponytail: guard against a missing thumbnail rendering a broken-image icon
                      const img = e.currentTarget;
                      const fallback = "https://placehold.co/600x400/1e293b/94a3b8?text=Project";
                      if (img.src !== fallback) img.src = fallback;
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        "linear-gradient(to top, oklch(var(--background) / var(--opacity-overlay)), transparent)",
                    }}
                  />

                  {/* Quick Links Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Live Demo
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-card border hover:bg-accent transition-colors"
                        aria-label="View on GitHub"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold">{project.title}</h3>
                    {project.featured && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                        Featured
                      </span>
                    )}
                  </div>

                  {project.tagline && (
                    <p className="text-sm font-medium text-foreground mb-3">{project.tagline}</p>
                  )}

                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.technologies.slice(0, 4).map((tech) => (
                      <span key={tech} className="tech-badge text-xs">
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 4 && (
                      <span className="text-xs text-muted-foreground">
                        +{project.technologies.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Challenge/Impact — only render if data exists */}
                  {(project.challenge || project.impact) && (
                    <div className="space-y-2 text-sm">
                      {project.challenge && (
                        <div>
                          <span className="font-medium text-primary">Challenge: </span>
                          <span className="text-muted-foreground line-clamp-1">
                            {project.challenge}
                          </span>
                        </div>
                      )}
                      {project.impact && (
                        <div>
                          <span className="font-medium text-secondary">Impact: </span>
                          <span className="text-muted-foreground line-clamp-1">
                            {project.impact}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Case Study Link */}
                  {project.caseStudyUrl && (
                    <a
                      href={project.caseStudyUrl}
                      className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary hover:gap-2 transition-all"
                    >
                      Read Case Study
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-300">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: "oklch(var(--primary) / 0.08)",
                border: "1px solid oklch(var(--primary) / 0.15)",
              }}
            >
              <FolderOpen className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-muted-foreground mb-2">
              {activeFilter ? "No projects found" : "No projects yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              {activeFilter
                ? "Try a different technology filter."
                : "Check back soon for featured projects."}
            </p>
            {activeFilter && (
              <button
                onClick={() => setActiveFilter(null)}
                className="mt-4 text-sm font-medium text-primary hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/** Compare two project lists by stable id order. */
function sameIds(a: DisplayProject[], b: DisplayProject[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i].id !== b[i].id) return false;
  return true;
}
