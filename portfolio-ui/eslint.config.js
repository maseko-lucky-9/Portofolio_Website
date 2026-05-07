import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Config files use Node-style `require()` — Tailwind plugins are typically
  // declared this way and the tailwind config itself is loaded by tools that
  // accept CJS. Relax the import-style rule for *.config.ts only.
  {
    files: ["*.config.{ts,js}", "**/*.config.{ts,js}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // shadcn/ui generated components ship with empty interface aliases (the
  // upstream codegen pattern) and occasional `any` for `cmdk` / Radix prop
  // forwarding. These files are vendored, not authored — keep the audit scope
  // on our own code.
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Auth/contact form scaffolding uses `any` for legacy react-hook-form
  // resolver typings. Pre-existing, unrelated to this UI refresh.
  {
    files: [
      "src/components/auth/**/*.{ts,tsx}",
      "src/components/examples/**/*.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
);
