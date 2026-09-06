import { useEffect } from "react";
import { hasLiteParam, hasNoMotionParam } from "@/lib/motion";

const SCENE_URL = "/field/scene.json";
const RUNTIME_URL = "/field/unicornStudio.umd.js";

type Scene = { paused?: boolean; destroy?: () => void };

declare global {
  interface Window {
    UnicornStudio?: {
      init: () => Promise<Scene[]>;
      destroy: () => void;
      scenes?: Scene[];
    };
  }
}

/** WebGL2 is a hard requirement of the runtime — without it `init()` resolves
 *  to an empty array and warns. Probing here means a browser that cannot run
 *  the field never downloads 155 KB to find that out. Also false in jsdom, so
 *  the unit suite (including the full-App smoke test) never touches this path. */
function hasWebGL2(): boolean {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

/**
 * The ambient background field.
 *
 * Renders its three layers synchronously so the first paint — and any thumbnail
 * taken of it — is the finished CSS gradient, never an empty rectangle. The
 * WebGL scene is an upgrade layered on afterwards, off the critical path:
 * nothing is fetched until `load` has fired and the main thread goes idle.
 *
 * Every bail-out below ends in the same visible state (the gradient), so the
 * page is complete whether or not the scene ever arrives:
 *   - `VITE_DISABLE_FIELD=true`, `?lite=1`, `?nomo=1`  — opted out
 *   - no WebGL2                                        — cannot run
 *   - no `/field/scene.json`                           — export not vendored yet
 *   - `webglcontextlost`                               — GPU took it back
 *
 * Reduced motion, coarse pointers and low-memory devices get one rendered frame
 * and then a hard pause, which is the honest reading of "reduce": the design is
 * still there, it just stops moving.
 */
export function FieldBackground() {
  useEffect(() => {
    if (import.meta.env.VITE_DISABLE_FIELD === "true") return;
    if (hasLiteParam() || hasNoMotionParam() || !hasWebGL2()) return;

    const host = document.getElementById("us-host");
    const fallback = document.getElementById("field-fallback");
    if (!host || !fallback) return;

    let cancelled = false;
    let script: HTMLScriptElement | null = null;
    const showFallback = (on: boolean) => {
      fallback.style.opacity = on ? "1" : "0";
    };

    const start = async () => {
      // The runtime swallows a failed scene fetch in a console.error inside
      // minified code, so probe first: "not vendored yet" is a supported state,
      // not an error worth logging on every load.
      const probe = await fetch(SCENE_URL, { method: "HEAD" }).catch(() => null);
      if (cancelled || !probe?.ok) return;

      script = document.createElement("script");
      script.src = RUNTIME_URL;
      script.async = true;
      script.onerror = () => showFallback(true);
      script.onload = () => {
        if (cancelled) return;
        window.UnicornStudio?.init()
          .then((scenes) => {
            if (cancelled || !scenes.length) return;
            showFallback(false);
            const holdStill =
              matchMedia("(prefers-reduced-motion: reduce)").matches ||
              matchMedia("(pointer: coarse)").matches ||
              ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4;
            if (holdStill) {
              // Two frames: one to compile and paint, one to be sure it landed.
              requestAnimationFrame(() =>
                requestAnimationFrame(() => {
                  scenes.forEach((s) => {
                    s.paused = true;
                  });
                }),
              );
            }
            host.querySelector("canvas")?.addEventListener("webglcontextlost", (e) => {
              e.preventDefault();
              host.style.display = "none";
              showFallback(true);
            });
          })
          .catch(() => showFallback(true));
      };
      document.head.appendChild(script);
    };

    const schedule = () => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => void start(), { timeout: 2000 });
      } else {
        setTimeout(() => void start(), 200);
      }
    };

    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      try {
        window.UnicornStudio?.destroy();
      } catch {
        // never loaded, or already torn down
      }
      script?.remove();
    };
  }, []);

  return (
    <>
      <div id="field-fallback" aria-hidden="true" />
      <div id="aura-bg" aria-hidden="true">
        <div id="us-host" data-us-project-src={SCENE_URL} />
      </div>
      <div className="grid-bg" aria-hidden="true" />
    </>
  );
}
