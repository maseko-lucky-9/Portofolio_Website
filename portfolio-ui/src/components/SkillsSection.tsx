import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const categoryIcons = {
  frontend: Code2,
  backend: Server,
  devops: Cloud,
};

const categoryColors = {
  frontend: "hsl(217, 91%, 60%)",
  backend: "hsl(160, 84%, 39%)",
  devops: "hsl(280, 65%, 60%)",
};

export function SkillsSection() {
  const [activeCategory, setActiveCategory] = useState<SkillCategory>("frontend");

  const currentRadarData = radarSkills[activeCategory];

  const filteredSkills = skills.filter((skill) => skill.category === activeCategory);

  const getProficiencyLabel = (value: number) => {
    if (value >= 90) return "Expert";
    if (value >= 75) return "Advanced";
    if (value >= 50) return "Intermediate";
    return "Beginner";
  };

  return (
    <section id="skills" aria-labelledby="skills-heading" className="py-20 bg-muted/30">
      <div className="section-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 id="skills-heading" className="section-title">Skills & Expertise</h2>
          <p className="section-subtitle mx-auto">
            A T-shaped developer with deep expertise in specific areas and broad knowledge
            across the stack.
          </p>
        </motion.div>

        {/* Category Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex justify-center gap-2 mb-12 flex-wrap"
        >
          {(["frontend", "backend", "devops"] as SkillCategory[]).map((category) => {
            const Icon = categoryIcons[category];
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border hover:border-primary hover:text-primary"
                }`}
                style={{
                  boxShadow: isActive ? "var(--shadow-glow)" : "var(--shadow-sm)",
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="capitalize">{category}</span>
              </button>
            );
          })}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Radar Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="skill-radar-container"
          >
            <h3 className="text-lg font-semibold mb-4 capitalize">{activeCategory} Skills</h3>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={currentRadarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  />
                  <Radar
                    name="Proficiency"
                    dataKey="value"
                    stroke={categoryColors[activeCategory]}
                    fill={categoryColors[activeCategory]}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Skills List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-semibold mb-6">Technologies & Tools</h3>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {filteredSkills.map((skill, index) => (
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{skill.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground capitalize">
                          {skill.type}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {getProficiencyLabel(skill.proficiency)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.proficiency}%` }}
                        transition={{ duration: 0.8, delay: index * 0.05 }}
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${categoryColors[activeCategory]}, ${categoryColors[activeCategory]}80)`,
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
