import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Github, ChevronRight, AlertCircle, FolderOpen } from "lucide-react";
import { useFeaturedProjects } from "@/hooks/use-projects";
import { projects as staticProjects, allTechnologies as staticTechnologies } from "@/data/projects";
import { env } from "@/config/env";
import { Skeleton } from "@/components/ui/skeleton";
import type { Project as ApiProject } from "@/types/api";

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
    // These fields don't exist in API — gracefully omitted
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

const springTransition = { type: "spring", stiffness: 260, damping: 26 };

export function ProjectsSection() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Fetch from API if enabled, otherwise use static data
  const { data: apiResponse, isLoading, isError, refetch } = useFeaturedProjects(6);

  // Determine data source: API response → static fallback
  const projects: DisplayProject[] = useMemo(() => {
    if (!env.useApi && !apiResponse) return staticProjects;

    if (apiResponse?.data) {
      const apiData = Array.isArray(apiResponse.data) ? apiResponse.data : [apiResponse.data];
      return apiData.map(mapApiProject);
    }

    // Fallback to static on error or no data
    return staticProjects;
  }, [apiResponse]);

  // Derive unique technologies from current data source
  const allTechnologies = useMemo(() => {
    if (!env.useApi && !apiResponse) return staticTechnologies;
    return [...new Set(projects.flatMap((p) => p.technologies))].sort();
  }, [projects, apiResponse]);

  const filteredProjects = activeFilter
    ? projects.filter((p) => p.technologies.includes(activeFilter))
    : projects;

  return (
    <section id="projects" aria-labelledby="projects-heading" className="py-20 section-mesh">
      <div className="section-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
            Portfolio
          </span>
          <h2 id="projects-heading" className="section-title">Featured Projects</h2>
          <p className="section-subtitle mx-auto">
            A selection of projects showcasing my expertise in building scalable,
            user-focused applications.
          </p>
        </motion.div>

        {/* Technology Filters */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-2 mb-12"
          >
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
          </motion.div>
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 mb-8 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Unable to load latest projects.</span>
            <button
              onClick={() => refetch()}
              className="underline font-medium hover:no-underline"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Projects Grid */}
        {!isLoading && filteredProjects.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, index) => (
                <motion.article
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.08, ...springTransition }}
                  className="card-project group"
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
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

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
                      <p className="text-sm font-medium text-gradient-primary mb-3">
                        {project.tagline}
                      </p>
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
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "hsl(var(--primary) / 0.08)", border: "1px solid hsl(var(--primary) / 0.15)" }}>
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
          </motion.div>
        )}
      </div>
    </section>
  );
}
