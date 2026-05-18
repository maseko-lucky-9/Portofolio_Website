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
      port: 8080,
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
      port: 8080,
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
      // Exclude charts-vendor from automatic <link rel="modulepreload">
      // injection — only loaded by SkillsSection (lazy + IO-gated).
      // (three-vendor chunk removed in phase-7 audit remediation.)
      modulePreload: {
        polyfill: true,
        resolveDependencies: (_filename, deps) =>
          deps.filter((dep) => !dep.includes("charts-vendor")),
      },
      rollupOptions: {
        output: {
          manualChunks: {
            // Animation libs share a vendor chunk — used across multiple eager
            // and lazy sections, so isolating them lets the browser cache once.
            'motion-vendor': ['framer-motion', 'lenis'],
            // Recharts (+ d3-scale/shape/interpolate) only used in SkillsSection
            // (lazy) — co-locating it here ensures the main chunk stays lean.
            'charts-vendor': ['recharts'],
          },
        },
      },
    },
  };
});
