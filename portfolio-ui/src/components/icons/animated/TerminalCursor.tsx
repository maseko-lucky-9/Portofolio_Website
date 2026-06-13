/**
 * TerminalCursor — underscore cursor with 1 Hz blink.
 *
 * Optional `typeText` prop reveals characters one-at-a-time on mount
 * (200 ms per char), then leaves the cursor blinking at the end.
 * Without `typeText`, just renders a standalone blinking underscore.
 *
 * Reduced-motion: cursor is shown static at full opacity; typed text
 * renders fully on mount.
 */
import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { useReducedMotion } from "@/lib/motion";
import { useAnime } from "@/lib/use-anime";

export interface TerminalCursorProps {
  /** Optional text to type out character-by-character on mount. */
  typeText?: string;
  /** Characters per minute (default 360 = 6/sec, gentle typing). */
  cpm?: number;
  className?: string;
  /** Override the default primary token. */
  color?: string;
}

export function TerminalCursor({
  typeText,
  cpm = 360,
  className,
  color = "oklch(var(--primary))",
}: TerminalCursorProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [typedChars, setTypedChars] = useState(
    reduced ? (typeText?.length ?? 0) : 0,
  );

  // Typewriter: advance one character per `60000 / cpm` ms.
  useEffect(() => {
    if (!typeText || reduced) return;
    if (typedChars >= typeText.length) return;
    const id = setTimeout(() => setTypedChars((n) => n + 1), 60000 / cpm);
    return () => clearTimeout(id);
  }, [typeText, typedChars, cpm, reduced]);

  // Cursor blink — starts after typing completes (or immediately if
  // there is no typeText).
  useAnime(
    wrapperRef,
    (scope) => {
      if (scope.matches.reducedMotion) return;
      const c = cursorRef.current;
      if (!c) return;
      const blinkDelay = typeText ? (typeText.length * 60000) / cpm : 0;
      animate(c, {
        opacity: [1, 0],
        duration: 500,
        loop: true,
        alternate: true,
        ease: "linear",
        delay: blinkDelay,
      });
    },
    [typeText, cpm],
  );

  return (
    <span ref={wrapperRef} className={className} aria-hidden="true">
      {typeText && <span>{typeText.slice(0, typedChars)}</span>}
      <span
        ref={cursorRef}
        style={{
          display: "inline-block",
          width: "0.55em",
          height: "1em",
          marginLeft: "0.1em",
          verticalAlign: "text-bottom",
          background: color,
        }}
      />
    </span>
  );
}
