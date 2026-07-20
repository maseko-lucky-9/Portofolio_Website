/**
 * MagneticLink — wraps a button (or any focusable element) and applies a
 * subtle magnetic-cursor effect via the `useMagnetic` hook.
 *
 * Used for nav links and primary CTAs. Effect is small by design (6 px
 * by default). Above 8 px it reads as gimmicky to senior-eng audiences.
 * Automatically no-ops under prefers-reduced-motion.
 */
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { useMagnetic } from "@/lib/motion";

interface MagneticLinkProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  strength?: number;
}

export const MagneticLink = forwardRef<HTMLButtonElement, MagneticLinkProps>(function MagneticLink(
  { strength = 6, children, ...rest },
  _forwardedRef,
) {
  const magneticRef = useMagnetic<HTMLButtonElement>(strength);
  return (
    <button ref={magneticRef} {...rest}>
      {children}
    </button>
  );
});
