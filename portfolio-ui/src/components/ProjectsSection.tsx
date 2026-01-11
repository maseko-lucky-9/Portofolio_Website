import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Github, BookOpen, ChevronRight } from "lucide-react";
import { projects, allTechnologies } from "@/data/projects";

export function ProjectsSection() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filteredProjects = activeFilter
    ? projects.filter((p) => p.technologies.includes(activeFilter))
    : projects;

  return (
    <section id="projects" className="py-20">
      <div className="section-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="section-title">Featured Projects</h2>
          <p className="section-subtitle mx-auto">
            A selection of projects showcasing my expertise in building scalable,
            user-focused applications.
          </p>
        </motion.div>

        {/* Technology Filters */}
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

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <motion.article
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="card-project group"
              >
                {/* Thumbnail */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={project.thumbnail}
                    alt={project.title}
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

                  <p className="text-sm font-medium text-gradient-primary mb-3">
                    {project.tagline}
                  </p>

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

                  {/* Challenge/Solution/Impact */}
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-primary">Challenge: </span>
                      <span className="text-muted-foreground line-clamp-1">
                        {project.challenge}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-secondary">Impact: </span>
                      <span className="text-muted-foreground line-clamp-1">
                        {project.impact}
                      </span>
                    </div>
                  </div>

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

        {filteredProjects.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-muted-foreground py-12"
          >
            No projects found with this technology. Try a different filter.
          </motion.p>
        )}
      </div>
    </section>
  );
}
