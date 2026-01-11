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
