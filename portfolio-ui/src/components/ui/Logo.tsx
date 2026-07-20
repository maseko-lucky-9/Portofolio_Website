/**
 * Logo — single source of truth for the site brand lockup.
 *
 * Renders the "Thulani.dev" text wordmark used in Navbar + Footer.
 * The full "Thulani Maseko" wordmark SVG in `public/brand/wordmark/`
 * is an off-site asset (social avatars, OG card composition) and is not
 * consumed by this component.
 */
import { personalData } from "@/data/personal";

type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  size?: LogoSize;
  className?: string;
}

const sizeClasses: Record<LogoSize, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
};

export function Logo({ size = "md", className = "" }: LogoProps) {
  const firstName = personalData.name.split(" ")[0];

  return (
    <span
      className={`font-bold inline-block ${sizeClasses[size]} ${className}`}
      aria-label={personalData.name}
    >
      <span className="text-gradient-primary">{firstName}</span>
      <span className="text-muted-foreground font-medium">.dev</span>
      {/* Visually-hidden full name for screen readers */}
      <span className="sr-only">{` ${personalData.name}`}</span>
    </span>
  );
}
