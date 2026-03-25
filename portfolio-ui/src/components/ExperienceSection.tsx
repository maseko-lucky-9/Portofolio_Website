import { motion } from "framer-motion";
import { MapPin, Building2, Calendar } from "lucide-react";
import { experiences } from "@/data/experience";

const springTransition = { type: "spring", stiffness: 260, damping: 26 };

export function ExperienceSection() {
  return (
    <section id="experience" aria-labelledby="experience-heading" className="py-20 md:py-28">
      <div className="section-container !py-0 py-20 md:py-28">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={springTransition}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
            Career
          </span>
          <h2 id="experience-heading" className="section-title">Experience</h2>
          <p className="section-subtitle mx-auto">
            My professional journey building products and leading teams.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="max-w-3xl mx-auto">
          {experiences.map((exp, index) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.08, ...springTransition }}
              className="relative pl-12 pb-12 last:pb-0"
            >
              {/* Timeline line */}
              {index !== experiences.length - 1 && <div className="timeline-line" />}

              {/* Timeline dot */}
              <div className="absolute left-0 top-0 timeline-dot" />

              {/* Content card */}
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border bg-card p-6"
                style={{
                  boxShadow: "var(--shadow-md)",
                  borderColor: "hsl(var(--border))",
                  transition: "box-shadow 0.3s ease, border-color 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "var(--shadow-xl), var(--shadow-glow)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "hsl(var(--primary) / 0.30)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
                  (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
                }}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
                  {exp.logoUrl && (
                    <img
                      src={exp.logoUrl}
                      alt={exp.company}
                      className="w-11 h-11 rounded-xl object-cover border"
                      style={{ borderColor: "hsl(var(--border))" }}
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-foreground mb-1">{exp.role}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <div className="flex items-center gap-1.5 text-primary text-sm font-medium">
                        <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{exp.company}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span>{exp.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Duration chip */}
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0"
                    style={{
                      background: "hsl(var(--primary) / 0.08)",
                      color: "hsl(var(--primary))",
                      border: "1px solid hsl(var(--primary) / 0.2)",
                    }}
                  >
                    <Calendar className="w-3 h-3" />
                    {exp.startDate} – {exp.endDate}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{exp.description}</p>

                {/* Achievements */}
                <ul className="space-y-2 mb-5">
                  {exp.achievements.map((achievement, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: "hsl(var(--secondary))" }}
                      />
                      <span className="text-foreground/85">{achievement}</span>
                    </li>
                  ))}
                </ul>

                {/* Tech stack */}
                <div className="flex flex-wrap gap-1.5">
                  {exp.technologies.map((tech) => (
                    <span key={tech} className="tech-badge text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
