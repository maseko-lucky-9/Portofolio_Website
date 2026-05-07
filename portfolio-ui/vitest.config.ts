import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Mirror build-time defines so modules consuming them load under jsdom.
  define: {
    __APP_VERSION__: JSON.stringify("0.0.0-test"),
    __SHIPPED_COUNT__: JSON.stringify("0"),
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: [
        "node_modules/",
        "src/test/",
        "src/mocks/",
        "src/components/ui/", // shadcn generated — no need to test
      ],
    },
  },
});
