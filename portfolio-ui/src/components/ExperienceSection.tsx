import { motion } from "framer-motion";
import { MapPin, Building2 } from "lucide-react";
import { experiences } from "@/data/experience";

export function ExperienceSection() {
  return (
    <section id="experience" className="py-20">
      <div className="section-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="section-title">Experience</h2>
          <p className="section-subtitle mx-auto">
            My professional journey building products and leading teams.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="max-w-3xl mx-auto">
          {experiences.map((exp, index) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-10 pb-12 last:pb-0"
            >
              {/* Timeline line */}
              {index !== experiences.length - 1 && <div className="timeline-line" />}

              {/* Timeline dot */}
              <div className="absolute left-0 top-0 timeline-dot" />

              {/* Content Card */}
              <div
                className="rounded-xl border bg-card p-6 transition-all hover:-translate-y-1"
                style={{ boxShadow: "var(--shadow-md)" }}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
                  {/* Company Logo */}
                  {exp.logoUrl && (
                    <img
                      src={exp.logoUrl}
                      alt={exp.company}
                      className="w-12 h-12 rounded-lg object-cover border"
                    />
                  )}

                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{exp.role}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <div className="flex items-center gap-1 text-primary">
                        <Building2 className="w-4 h-4" />
                        <span className="font-medium">{exp.company}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{exp.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {exp.startDate} – {exp.endDate}
                  </div>
                </div>

                {/* Description */}
                <p className="text-muted-foreground mb-4">{exp.description}</p>

                {/* Achievements */}
                <ul className="space-y-2 mb-4">
                  {exp.achievements.map((achievement, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>

                {/* Technologies */}
                <div className="flex flex-wrap gap-1.5">
                  {exp.technologies.map((tech) => (
                    <span key={tech} className="tech-badge text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
