/**
 * Environment Configuration for Portfolio UI
 *
 * This module provides typed access to environment variables
 * with validation and sensible defaults.
 *
 * Usage:
 *   import { env, apiUrl } from '@/config/env';
 *   console.log(env.apiUrl);
 *   // or use the helper
 *   console.log(apiUrl('/projects')); // -> http://localhost:3000/v1/projects
 */

// Helper to convert string to boolean
const toBool = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

// Environment configuration object
export const env = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  apiVersion: import.meta.env.VITE_API_VERSION || 'v1',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',

  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || 'Portfolio',
  appDescription: import.meta.env.VITE_APP_DESCRIPTION || 'My Portfolio Website',

  // Feature Flags
  enableAnalytics: toBool(import.meta.env.VITE_ENABLE_ANALYTICS, true),
  enableCodeExecution: toBool(import.meta.env.VITE_ENABLE_CODE_EXECUTION, true),
  enableComments: toBool(import.meta.env.VITE_ENABLE_COMMENTS, true),

  // Debug Mode
  debug: toBool(import.meta.env.VITE_DEBUG, import.meta.env.DEV),

  // Vite built-in
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;

/**
 * Build a full API URL with the configured base URL and version
 * @param path - The API endpoint path (e.g., '/projects', '/articles')
 * @returns Full URL (e.g., 'http://localhost:3000/v1/projects')
 */
export const apiUrl = (path: string): string => {
  const base = env.apiUrl.replace(/\/$/, ''); // Remove trailing slash
  const version = env.apiVersion;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}/${version}${cleanPath}`;
};

/**
 * Build a WebSocket URL
 * @param path - The WebSocket endpoint path
 * @returns Full WebSocket URL
 */
export const wsUrl = (path: string = ''): string => {
  const base = env.wsUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : path ? `/${path}` : '';
  return `${base}${cleanPath}`;
};

// Log environment in development
if (env.debug) {
  console.log('🔧 Environment Configuration:', {
    apiUrl: env.apiUrl,
    apiVersion: env.apiVersion,
    mode: env.mode,
    features: {
      analytics: env.enableAnalytics,
      codeExecution: env.enableCodeExecution,
      comments: env.enableComments,
    },
  });
}

export default env;
