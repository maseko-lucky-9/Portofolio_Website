/**
 * AuroraBackground — hero-section animated gradient.
 *
 * Critical-path design:
 *   1. On first render: show CSSGradientFallback immediately (fast FCP / LCP).
 *   2. After first paint (useEffect): set `mounted = true`, lazy-import
 *      AuroraCanvas (which owns all Three.js / @react-three/fiber code).
 *   3. Suspense shows CSS gradient while the Three.js chunk loads (~970 KB).
 *
 * Because AuroraCanvas is dynamically imported (not a static import), Vite
 * will NOT emit a <link rel="modulepreload"> for three-vendor in index.html,
 * removing it from the critical rendering path entirely.
 *
 * WebGL skip conditions (CSS gradient shown permanently):
 *   • VITE_DISABLE_WEBGL=true — baked at build time for Playwright e2e builds
 *   • user prefers-reduced-motion at OS/browser level
 */
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useShouldRenderWebGL } from "@/lib/motion";

// Dynamically imported — Three.js code lives here, NOT in this module.
// React.lazy defers the import() call until the component actually renders,
// which we gate behind `mounted` (set by useEffect = after first paint).
const LazyAuroraCanvas = lazy(() => import("./AuroraCanvas"));

export function CSSGradientFallback() {
  return (
    <>
      <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-secondary/10 to-primary/10 rounded-full blur-3xl" />
    </>
  );
}

export function AuroraBackground() {
  const shouldRenderWebGL = useShouldRenderWebGL();
  const { resolvedTheme } = useTheme();
  const mouseRef = useRef({ x: 0, y: 0 });
  const lastMouseUpdate = useRef(0);

  // Gate: show CSS gradient on first render, upgrade to WebGL after first paint.
  // Using a ref-based flag rather than state prevents a synchronous double-render.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // This runs after the browser has painted the first frame.
    // Setting mounted triggers a re-render that swaps in LazyAuroraCanvas.
    setMounted(true);
  }, []);

  const opacity = resolvedTheme === "dark" ? 0.35 : 0.25;

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Throttle to ~60fps
    const now = performance.now();
    if (now - lastMouseUpdate.current < 16.67) return;
    lastMouseUpdate.current = now;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    mouseRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
    };
  }, []);

  // useShouldRenderWebGL composes every skip condition (Plan 4):
  // build flag, reduced motion, ?lite=1, saveData, slow connection.
  // First paint also stays on CSS until `mounted` flips after first frame.
  if (!shouldRenderWebGL || !mounted) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <CSSGradientFallback />
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Suspense fallback = CSS gradient while three-vendor chunk downloads */}
      <Suspense
        fallback={
          <div className="absolute inset-0 overflow-hidden">
            <CSSGradientFallback />
          </div>
        }
      >
        <LazyAuroraCanvas opacity={opacity} mouseRef={mouseRef} />
      </Suspense>
    </div>
  );
}
