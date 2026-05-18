import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Building2, Calendar, MapPin } from "lucide-react";
import { experiences, type Experience } from "@/data/experience";
import { fadeUp, springTransition } from "@/lib/motion";

const HOVER_CLOSE_MS = 120;

function GridBackground() {
  return (
    <svg
      className="timeline-grid-bg"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="exp-grid"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#exp-grid)" />
    </svg>
  );
}

interface ExperienceRowProps {
  exp: Experience;
  index: number;
  isOpen: boolean;
  onOpen: () => void;
  onScheduleClose: () => void;
  onCancelClose: () => void;
  onToggle: () => void;
  reduceMotion: boolean;
}

function ExperienceRow({
  exp,
  index,
  isOpen,
  onOpen,
  onScheduleClose,
  onCancelClose,
  onToggle,
  reduceMotion,
}: ExperienceRowProps) {
  const stepNumber = String(index + 1).padStart(2, "0");
  const isLeft = index % 2 === 0;
  const pillText = exp.technologies.slice(0, 3).join(" · ");
  const detailsId = `exp-${exp.id}-details`;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onToggle();
      }
    },
    [onToggle],
  );

  const expandedPanel = (
    <div
      id={detailsId}
      className="mt-4 pt-4 border-t border-border/60 space-y-4"
    >
      <p className="text-sm text-foreground/85 leading-relaxed">
        {exp.description}
      </p>

      {exp.achievements.length > 0 && (
        <ul className="space-y-2">
          {exp.achievements.map((achievement, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <span
                className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: "hsl(var(--primary))" }}
              />
              <span className="text-foreground/85">{achievement}</span>
            </li>
          ))}
        </ul>
      )}

      {exp.technologies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {exp.technologies.map((tech) => (
            <span key={tech} className="tech-badge text-xs">
              {tech}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: index * 0.08 }}
      className={`relative flex md:items-start ${
        isLeft ? "md:flex-row" : "md:flex-row-reverse"
      } mb-12 last:mb-0`}
    >
      {/* Node — desktop centered, mobile left */}
      <div
        className="timeline-node hidden md:block md:left-1/2 md:top-8 md:-translate-x-1/2"
        aria-hidden="true"
      />
      <div
        className="timeline-node md:hidden left-[19px] top-8"
        aria-hidden="true"
      />

      {/* Card slot */}
      <div className="w-full md:w-[calc(50%-40px)] pl-14 md:pl-0">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
          aria-controls={detailsId}
          aria-label={`${exp.role} at ${exp.company}, ${exp.startDate} to ${exp.endDate}. ${isOpen ? "Collapse" : "Expand"} details.`}
          onMouseEnter={onOpen}
          onMouseLeave={onScheduleClose}
          onFocus={onCancelClose}
          onBlur={onScheduleClose}
          onClick={onToggle}
          onKeyDown={handleKeyDown}
          className="relative rounded-xl border border-border bg-card p-6 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          style={{
            boxShadow: isOpen
              ? "var(--shadow-xl), 0 0 0 1px hsl(var(--primary) / 0.18)"
              : "var(--shadow-md)",
            transition:
              "box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s ease",
          }}
        >
          <span className="experience-card-bar" aria-hidden="true" />

          {/* Step number */}
          <div className="font-mono text-[13px] tracking-wider text-[hsl(var(--primary)/0.8)] mb-3">
            {stepNumber}
          </div>

          {/* Title row */}
          <div className="flex items-start gap-3 mb-2">
            {exp.logoUrl && (
              <img
                src={exp.logoUrl}
                alt={exp.company}
                className="w-7 h-7 rounded-md object-cover border flex-shrink-0 mt-0.5"
                style={{ borderColor: "hsl(var(--border))" }}
              />
            )}
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-foreground leading-snug">
                {exp.role}
              </h3>
              <div className="flex items-center gap-1.5 text-primary text-sm font-medium mt-0.5">
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{exp.company}</span>
              </div>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {exp.startDate} – {exp.endDate}
            </span>
            <span className="opacity-50">·</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              {exp.location}
            </span>
          </div>

          {/* Slim summary (clamped) — hidden when expanded to avoid duplication */}
          {!isOpen && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
              {exp.description}
            </p>
          )}

          {/* Expanded details */}
          {reduceMotion ? (
            <div hidden={!isOpen}>{expandedPanel}</div>
          ) : (
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={springTransition}
                  style={{ willChange: "height", overflow: "hidden" }}
                >
                  {expandedPanel}
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Pill */}
          {pillText && (
            <div
              className="inline-flex items-center mt-4 px-3 py-1 rounded-full font-mono uppercase tracking-[0.15em] text-[10px]"
              style={{
                background: "hsl(var(--primary) / 0.08)",
                color: "hsl(var(--primary))",
                border: "1px solid hsl(var(--primary) / 0.2)",
              }}
            >
              {pillText}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ExperienceSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setOpenId(null);
      closeTimerRef.current = null;
    }, HOVER_CLOSE_MS);
  }, [cancelClose]);

  useEffect(() => () => cancelClose(), [cancelClose]);

  const openCard = (id: string) => {
    cancelClose();
    setOpenId(id);
  };

  const toggleCard = (id: string) => {
    cancelClose();
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="relative py-20 md:py-28 overflow-hidden"
    >
      <GridBackground />

      <div className="section-container !py-0 relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={springTransition}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-mono uppercase tracking-[0.2em] text-[hsl(var(--primary)/0.8)] mb-3">
            Career
          </span>
          <h2 id="experience-heading" className="section-title">
            Experience
          </h2>
          <p className="section-subtitle mx-auto">
            My professional journey building products and leading teams.
          </p>
        </motion.div>

        {/* Zigzag timeline */}
        <div className="relative max-w-6xl mx-auto">
          {/* Spine — desktop centered, mobile left:27px */}
          <div
            className="timeline-spine hidden md:block left-1/2 -translate-x-1/2"
            aria-hidden="true"
          />
          <div
            className="timeline-spine md:hidden left-[27px]"
            aria-hidden="true"
          />

          {experiences.map((exp, index) => (
            <ExperienceRow
              key={exp.id}
              exp={exp}
              index={index}
              isOpen={openId === exp.id}
              onOpen={() => openCard(exp.id)}
              onScheduleClose={scheduleClose}
              onCancelClose={cancelClose}
              onToggle={() => toggleCard(exp.id)}
              reduceMotion={!!prefersReducedMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
