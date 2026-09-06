import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { Building2, Calendar, MapPin } from "lucide-react";
import { experiences, type Experience } from "@/data/experience";
import { useReducedMotion } from "@/lib/motion";
import { revealOnScroll, useAnime } from "@/lib/use-anime";

const HOVER_CLOSE_MS = 120;

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

  // Hover-to-open must not fire for touch. A tap synthesises pointerenter
  // before click, so onOpen would expand the card and onToggle would collapse
  // it again in the same tap — the first tap appeared to do nothing.
  // Keyed off pointerType rather than a media query so hybrid devices
  // (touchscreen laptops) still get hover from an actual mouse.
  const handlePointerEnter = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse") onOpen();
    },
    [onOpen],
  );

  const handlePointerLeave = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse") onScheduleClose();
    },
    [onScheduleClose],
  );

  const expandedPanel = (
    <div id={detailsId} className="mt-4 pt-4 border-t border-border/60 space-y-4">
      <p className="text-sm text-foreground/85 leading-relaxed">{exp.description}</p>

      {exp.achievements.length > 0 && (
        <ul className="space-y-2">
          {exp.achievements.map((achievement, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              {/* Emerald, matching the hero availability badge. Step number,
                  card bar and tech pill stay indigo. */}
              <span
                className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: "oklch(var(--secondary))" }}
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
    <div
      data-anime-row
      className={`tl-row ${isLeft ? "even" : "odd"}`}
      // Initial state (opacity 0, translateY 16) is applied by the reveal
      // animation when motion is allowed; reduced-motion users see the
      // row at its natural position.
      style={{ opacity: reduceMotion ? 1 : 0 }}
    >
      {/* Node — desktop centered, mobile left. Stays 18px: the mobile node's
          centre (left 19 + 9) has to land on the spine's (left 27 + 1), and
          resizing it moves the centre off the spine. */}
      <span className="tl-node d" aria-hidden="true" />
      <span className="tl-node m" aria-hidden="true" />

      {/* Card slot. container-type lives HERE, not on the card: an element
          cannot be its own query container, so the card's own @[400px] rules
          never applied while the declaration sat on the card itself. */}
      <div className="tl-slot">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
          aria-controls={detailsId}
          aria-label={`${exp.role} at ${exp.company}, ${exp.startDate} to ${exp.endDate}. ${isOpen ? "Collapse" : "Expand"} details.`}
          data-open={isOpen ? "true" : "false"}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onFocus={onCancelClose}
          onBlur={onScheduleClose}
          onClick={onToggle}
          onKeyDown={handleKeyDown}
          className="tl-card spot"
        >
          <p className="mono tiny" style={{ marginBottom: 10 }}>
            {stepNumber}
          </p>

          <h3 className="tl-role">{exp.role}</h3>
          <p className="tl-co" style={{ marginTop: 4 }}>
            <Building2
              className="w-3.5 h-3.5 inline-block mr-1.5 align-[-2px]"
              aria-hidden="true"
            />
            {exp.company}
          </p>

          {/* Meta row — stacks vertically when the card is narrow, inline at
              400px and above. Container query on the slot, not the viewport. */}
          <div className="tl-meta mono tiny" style={{ marginTop: 12 }}>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3 h-3" aria-hidden="true" />
              {exp.startDate} – {exp.endDate}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3 h-3" aria-hidden="true" />
              {exp.location}
            </span>
          </div>

          {/* Slim summary — hidden when expanded to avoid duplication */}
          {!isOpen && (
            <p className="small" style={{ color: "var(--ink-60)" }}>
              {exp.description}
            </p>
          )}

          {/* Expanded details — grid-template-rows 0fr -> 1fr instead of
              animating height:auto, so no layout property is animated. */}
          <div className="tl-fold" aria-hidden={!isOpen}>
            <div>
              <div id={detailsId} className="tl-details">
                <p className="small" style={{ color: "var(--ink-70)" }}>
                  {exp.description}
                </p>

                {exp.achievements.length > 0 && (
                  <ul className="tl-ach">
                    {exp.achievements.map((achievement) => (
                      <li key={achievement}>{achievement}</li>
                    ))}
                  </ul>
                )}

                {exp.technologies.length > 0 && (
                  <div className="tl-tech">
                    {exp.technologies.map((tech) => (
                      <span key={tech} className="chip">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                {pillText && <span className="mono tiny on">{pillText}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExperienceSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const rootRef = useRef<HTMLElement>(null);

  // Section reveal: header fade-up + zigzag rows fan-in with stagger.
  useAnime(
    rootRef,
    (scope) => {
      const root = rootRef.current;
      if (!root) return;
      if (scope.matches.reducedMotion) return;
      const cleanups = [
        revealOnScroll(root, "[data-anime-header]"),
        // Stagger 80 ms per row matches the previous framer
        // transition={{ delay: index * 0.08 }} cadence.
        revealOnScroll(root, "[data-anime-row]", { staggerMs: 80 }),
      ];
      return () => cleanups.forEach((fn) => fn());
    },
    [],
  );

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
      ref={rootRef}
      // No id — the LazySection wrapper in Index.tsx owns `#experience`; see
      // the note in SkillsSection.
      aria-labelledby="experience-heading"
      className="s-solid sec-texture"
    >
      <div className="wrap">
        <div className="sec-head asym" data-anime-header>
          <div>
            <p className="eyebrow mono" style={{ marginBottom: 20 }}>
              <span className="dot">
                <i className="halo" />
                <i />
              </span>
              Career
            </p>
            <p className="body">
              Five positions, four of them permanent, mostly inside South African banking and
              enterprise IT. Open a card for the detail.
            </p>
          </div>
          <div className="right">
            <h2 id="experience-heading" className="display">
              Eight years <span className="fade">of production systems.</span>
            </h2>
          </div>
        </div>

        <div className="tl">
          <span className="tl-spine d" aria-hidden="true" />
          <span className="tl-spine m" aria-hidden="true" />

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
