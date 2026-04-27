import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },
    build: {
      // Exclude three-vendor from automatic <link rel="modulepreload"> injection.
      // three-vendor is only needed by AuroraCanvas, which is lazy-imported AFTER
      // first paint — there is no value preloading it on every page visit.
      // All other chunks (ContactSection, BlogSection, etc.) are still preloaded.
      modulePreload: {
        polyfill: true,
        resolveDependencies: (_filename, deps) =>
          deps.filter((dep) => !dep.includes("three-vendor")),
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          },
        },
      },
    },
  };
});
