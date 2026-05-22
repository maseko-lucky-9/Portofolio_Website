import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { execFileSync } from "node:child_process";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// Build-time commit count for the `shipped:` meter in the hero.
// execFileSync with array args — no shell, no injection surface.
function getCommitCount(): number {
  try {
    const out = execFileSync("git", ["rev-list", "--count", "HEAD"], {
      cwd: __dirname,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const n = Number.parseInt(out, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: "::",
      port: 5173,
      strictPort: true,
      // Note: HMR causes full-page reload in headless Playwright — use `npm run preview` for e2e tests.
      // Proxy API requests to the backend during development
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: false,
        },
        // WebSocket proxy for real-time features
        '/ws': {
          target: env.VITE_WS_URL || 'ws://localhost:3000',
          ws: true,
          changeOrigin: true,
        },
      },
    },
    // preview server: same port so Playwright config needs no change between dev and preview mode.
    preview: {
      host: "::",
      port: 5173,
      strictPort: true,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      process.env.ANALYZE === "true" &&
        visualizer({
          filename: "docs/perf/bundle-report.html",
          gzipSize: true,
          brotliSize: true,
          template: "treemap",
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __SHIPPED_COUNT__: JSON.stringify(getCommitCount()),
    },
    build: {
      // Vendor chunks isolate heavy 3rd-party code from app code so:
      //  (1) browser caches them across deploys when only app code changes,
      //  (2) the parser/eval cost is parallelizable,
      //  (3) main bundle reflects actual app size, not framework weight.
      //
      // Phase-12 removed three-vendor + charts-vendor (recharts -> SVG,
      // three.js gone). Phase-13 brought 3D back via @react-three/fiber for
      // the Scene component — Scene is eagerly imported in Index.tsx, so the
      // three-vendor chunk is critical-path again. Keep it isolated for cache.
      modulePreload: { polyfill: true },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;

            // React core + router — small, stable, on every page.
            if (
              /node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)
            ) {
              return 'react-vendor';
            }

            // Three.js + R3F + drei. Eagerly imported by Scene in Index.tsx;
            // isolating prevents it from doubling the main chunk on every code
            // change to the app.
            if (
              id.includes('/three/') ||
              id.includes('/@react-three/')
            ) {
              return 'three-vendor';
            }

            // Animation libs — used across eager + lazy sections.
            if (id.includes('/animejs/') || id.includes('/lenis/')) {
              return 'motion-vendor';
            }

            // Radix UI primitives — many small packages, share one chunk so
            // the import graph collapses cleanly.
            if (id.includes('/@radix-ui/')) {
              return 'radix-vendor';
            }

            // Data layer.
            if (id.includes('/@tanstack/react-query')) {
              return 'query-vendor';
            }

            // Icon set is large enough to deserve its own bucket.
            if (id.includes('/lucide-react/')) {
              return 'icons-vendor';
            }

            // Monaco — only used by CodeDemoSection which is lazy-loaded.
            // Forcing it into its own chunk keeps it deferred even if some
            // future import accidentally pulls it eagerly.
            if (id.includes('/@monaco-editor/') || id.includes('/monaco-editor/')) {
              return 'monaco-vendor';
            }

            return undefined;
          },
        },
      },
    },
  };
});
