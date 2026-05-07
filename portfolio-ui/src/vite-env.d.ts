/// <reference types="vite/client" />

/**
 * Type definitions for Vite environment variables
 * These provide TypeScript intellisense and type checking for import.meta.env
 */
interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_URL: string;
  readonly VITE_API_VERSION: string;
  readonly VITE_WS_URL: string;

  // App Configuration
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_DESCRIPTION: string;

  // Feature Flags
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_CODE_EXECUTION: string;
  readonly VITE_ENABLE_COMMENTS: string;

  // Debug Mode
  readonly VITE_DEBUG: string;

  // Vite built-in
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Build-time constants injected via Vite `define`.
 * - __APP_VERSION__: from package.json
 * - __SHIPPED_COUNT__: total commits on HEAD at build time
 */
declare const __APP_VERSION__: string;
declare const __SHIPPED_COUNT__: string;
