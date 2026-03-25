import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Code2, Server, Cloud } from "lucide-react";
import { skills, radarSkills, SkillCategory } from "@/data/skills";

const springTransition = { type: "spring", stiffness: 280, damping: 26 };

const categoryIcons = {
  frontend: Code2,
  backend: Server,
  devops: Cloud,
};

const categoryColors: Record<SkillCategory, string> = {
  frontend: "hsl(232, 85%, 65%)",
  backend: "hsl(158, 74%, 44%)",
  devops: "hsl(280, 65%, 62%)",
};

const categoryGradients: Record<SkillCategory, string> = {
  frontend: "linear-gradient(90deg, hsl(232, 85%, 65%), hsl(258, 78%, 60%))",
  backend: "linear-gradient(90deg, hsl(158, 74%, 44%), hsl(172, 70%, 38%))",
  devops: "linear-gradient(90deg, hsl(280, 65%, 62%), hsl(300, 60%, 55%))",
};

export function SkillsSection() {
  const [activeCategory, setActiveCategory] = useState<SkillCategory>("frontend");
  const prefersReducedMotion = useReducedMotion();

  const currentRadarData = radarSkills[activeCategory];
  const filteredSkills = skills.filter((skill) => skill.category === activeCategory);

  const getProficiencyLabel = (value: number) => {
    if (value >= 90) return "Expert";
    if (value >= 75) return "Advanced";
    if (value >= 50) return "Intermediate";
    return "Beginner";
  };

  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      className="py-20 md:py-28 relative overflow-hidden"
      style={{ background: "hsl(var(--muted) / 0.4)" }}
    >
      {/* Subtle top gradient fade */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.25), transparent)" }}
      />

      <div className="section-container !py-0 py-20 md:py-28">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={springTransition}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
            Expertise
          </span>
          <h2 id="skills-heading" className="section-title">Skills &amp; Expertise</h2>
          <p className="section-subtitle mx-auto">
            A T-shaped developer with deep expertise in specific areas and broad knowledge
            across the stack.
          </p>
        </motion.div>

        {/* Category toggle */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, ...springTransition }}
          className="flex justify-center gap-3 mb-14 flex-wrap"
        >
          {(["frontend", "backend", "devops"] as SkillCategory[]).map((category) => {
            const Icon = categoryIcons[category];
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all"
                style={{
                  background: isActive ? categoryGradients[category] : "hsl(var(--card))",
                  color: isActive ? "#fff" : "hsl(var(--foreground))",
                  border: isActive ? "1px solid transparent" : "1px solid hsl(var(--border))",
                  boxShadow: isActive
                    ? `0 4px 20px ${categoryColors[category]}55`
                    : "var(--shadow-sm)",
                  transform: isActive ? "scale(1.04)" : "scale(1)",
                  transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="capitalize">{category}</span>
              </button>
            );
          })}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Radar chart */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={springTransition}
            className="skill-radar-container"
          >
            <div className="flex items-center gap-2 mb-6">
              <div
                className="w-2 h-6 rounded-full"
                style={{ background: categoryGradients[activeCategory] }}
              />
              <h3 className="text-base font-semibold capitalize">{activeCategory} Radar</h3>
            </div>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={currentRadarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                  />
                  <Radar
                    name="Proficiency"
                    dataKey="value"
                    stroke={categoryColors[activeCategory]}
                    fill={categoryColors[activeCategory]}
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.75rem",
                      boxShadow: "var(--shadow-lg)",
                      fontSize: "0.8rem",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Skills list */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={springTransition}
          >
            <div className="flex items-center gap-2 mb-6">
              <div
                className="w-2 h-6 rounded-full"
                style={{ background: categoryGradients[activeCategory] }}
              />
              <h3 className="text-base font-semibold">Technologies &amp; Tools</h3>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {filteredSkills.map((skill, index) => (
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.045, ...springTransition }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-semibold text-foreground">{skill.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                          style={{
                            background: "hsl(var(--accent))",
                            color: "hsl(var(--accent-foreground))",
                          }}
                        >
                          {skill.type}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {getProficiencyLabel(skill.proficiency)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.proficiency}%` }}
                        transition={{
                          duration: prefersReducedMotion ? 0 : 0.7,
                          delay: index * 0.04,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="h-full rounded-full relative overflow-hidden"
                        style={{ background: categoryGradients[activeCategory] }}
                      >
                        {/* Shimmer highlight */}
                        {!prefersReducedMotion && (
                          <div
                            className="absolute inset-0 animate-shimmer"
                            style={{
                              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
                              backgroundSize: "200% 100%",
                            }}
                          />
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Subtle bottom border */}
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.15), transparent)" }}
      />
    </section>
  );
}
