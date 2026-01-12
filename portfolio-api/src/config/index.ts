import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Environment schema validation
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),
  API_VERSION: z.string().default('v1'),
  APP_NAME: z.string().default('Portfolio API'),
  APP_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),

  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),

  // Admin Setup
  ADMIN_EMAIL: z.string().email().default('admin@example.com'),
  ADMIN_PASSWORD: z.string().min(8).default('change-this-password'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3001'),
  CORS_CREDENTIALS: z.string().transform((v) => v === 'true').default('true'),

  // Rate Limiting
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_SECURE: z.string().transform((v) => v === 'true').optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('Portfolio <noreply@portfolio.dev>'),

  // Analytics
  IPINFO_TOKEN: z.string().optional(),
  ENABLE_ANALYTICS: z.string().transform((v) => v === 'true').default('true'),

  // Sentry
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default('development'),

  // Code Execution
  CODE_EXECUTION_ENABLED: z.string().transform((v) => v === 'true').default('true'),
  CODE_EXECUTION_TIMEOUT_MS: z.string().transform(Number).default('5000'),
  CODE_EXECUTION_MEMORY_MB: z.string().transform(Number).default('128'),
  CODE_EXECUTION_DOCKER_IMAGE: z.string().default('node:20-alpine'),

  // External Services
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),

  // OAuth Providers
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  OAUTH_STATE_SECRET: z.string().min(32).default('change-this-oauth-state-secret'),

  // Cache TTL
  CACHE_TTL_PROJECTS: z.string().transform(Number).default('3600'),
  CACHE_TTL_ARTICLES: z.string().transform(Number).default('3600'),
  CACHE_TTL_ANALYTICS: z.string().transform(Number).default('300'),

  // Feature Flags
  ENABLE_WEBSOCKETS: z.string().transform((v) => v === 'true').default('true'),
  ENABLE_CODE_EXECUTION: z.string().transform((v) => v === 'true').default('true'),
  ENABLE_NEWSLETTER: z.string().transform((v) => v === 'true').default('true'),
  DEMO_MODE: z.string().transform((v) => v === 'true').default('false'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z.string().transform((v) => v === 'true').default('true'),
});

// Parse and validate environment
const parseEnv = (): z.infer<typeof envSchema> => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors
        .filter((e) => e.message === 'Required')
        .map((e) => e.path.join('.'));
      const invalid = error.errors
        .filter((e) => e.message !== 'Required')
        .map((e) => `${e.path.join('.')}: ${e.message}`);

      console.error('\n❌ Environment validation failed:\n');
      if (missing.length) {
        console.error('Missing required variables:');
        missing.forEach((v) => console.error(`  - ${v}`));
      }
      if (invalid.length) {
        console.error('\nInvalid variables:');
        invalid.forEach((v) => console.error(`  - ${v}`));
      }
      console.error('\nPlease check your .env file.\n');
    }
    process.exit(1);
  }
};

const env = parseEnv();

// Export typed configuration
export const config = {
  // Application
  nodeEnv: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  port: env.PORT,
  host: env.HOST,
  apiVersion: env.API_VERSION,
  appName: env.APP_NAME,
  appUrl: env.APP_URL,

  // Database
  database: {
    url: env.DATABASE_URL,
  },

  // Redis
  redis: {
    url: env.REDIS_URL,
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },

  // Authentication
  auth: {
    jwtSecret: env.JWT_SECRET,
    accessExpiry: env.JWT_ACCESS_EXPIRY,
    refreshExpiry: env.JWT_REFRESH_EXPIRY,
    bcryptRounds: env.BCRYPT_ROUNDS,
  },

  // Admin
  admin: {
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  },

  // CORS
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: env.CORS_CREDENTIALS,
  },

  // Rate Limiting
  rateLimit: {
    max: env.RATE_LIMIT_MAX,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
  },

  // Email
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.EMAIL_FROM,
  },

  // Analytics
  analytics: {
    ipinfoToken: env.IPINFO_TOKEN,
    enabled: env.ENABLE_ANALYTICS,
  },

  // Sentry
  sentry: {
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
  },

  // Code Execution
  codeExecution: {
    enabled: env.CODE_EXECUTION_ENABLED,
    timeoutMs: env.CODE_EXECUTION_TIMEOUT_MS,
    memoryMb: env.CODE_EXECUTION_MEMORY_MB,
    dockerImage: env.CODE_EXECUTION_DOCKER_IMAGE,
  },

  // External Services
  github: {
    token: env.GITHUB_TOKEN,
    webhookSecret: env.GITHUB_WEBHOOK_SECRET,
  },

  // OAuth Configuration
  oauth: {
    github: {
      clientId: env.GITHUB_CLIENT_ID || '',
      clientSecret: env.GITHUB_CLIENT_SECRET || '',
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID || '',
      clientSecret: env.GOOGLE_CLIENT_SECRET || '',
    },
    stateSecret: env.OAUTH_STATE_SECRET,
  },

  // API URL for callbacks
  apiUrl: env.APP_URL,

  // Cache TTL
  cache: {
    projectsTtl: env.CACHE_TTL_PROJECTS,
    articlesTtl: env.CACHE_TTL_ARTICLES,
    analyticsTtl: env.CACHE_TTL_ANALYTICS,
  },

  // Feature Flags
  features: {
    websockets: env.ENABLE_WEBSOCKETS,
    codeExecution: env.ENABLE_CODE_EXECUTION,
    newsletter: env.ENABLE_NEWSLETTER,
    demoMode: env.DEMO_MODE,
  },

  // Logging
  logging: {
    level: env.LOG_LEVEL,
    pretty: env.LOG_PRETTY,
  },
} as const;

export type Config = typeof config;
export default config;
