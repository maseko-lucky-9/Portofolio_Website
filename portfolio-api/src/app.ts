import Fastify, { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifySensible from '@fastify/sensible';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import cookie from '@fastify/cookie';
import { config } from './config/index.js';
import { redis } from './config/redis.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import {
  requestLogger,
  responseLogger,
  addRequestIdHeader,
} from './middleware/request.middleware.js';
import { analyticsMiddleware } from './middleware/analytics.middleware.js';
import { registerRoutes } from './routes/index.js';
import path from 'path';

// Everything needed to build a fully-wired Fastify instance, and nothing that
// touches the process or the network.
//
// This used to live in index.ts, where the instance was constructed at module
// scope but plugins/hooks/routes were registered inside start(), which ran as a
// top-level side effect. Importing the module therefore gave you an app with no
// routes AND bound a listener as a side effect, so app.inject() was impossible
// and the e2e suite had nothing to drive.
//
// Deliberately NOT here: connectDatabase(), app.listen(), and the graceful
// shutdown wiring. See index.ts for why.

// Plugins
async function registerPlugins(app: FastifyInstance): Promise<void> {
  // Sensible (adds useful utilities)
  await app.register(fastifySensible);

  // Helmet for security headers
  await app.register(fastifyHelmet, {
    global: true,
    contentSecurityPolicy: config.isProduction
      ? undefined
      : {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
  });

  // CORS - using centralized security config
  const { securityConfig } = await import('./config/security.js');
  await app.register(fastifyCors, securityConfig.cors);

  // Cookie support for OAuth
  await app.register(cookie, {
    secret: config.oauth.stateSecret,
    parseOptions: {},
  });

  // Rate limiting
  await app.register(fastifyRateLimit, {
    global: true,
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs,
    cache: 10000,
    redis,
    nameSpace: 'rl:',
    skipOnError: true,
    keyGenerator: (request) => {
      return (request.headers['x-forwarded-for'] as string) || request.ip;
    },
    errorResponseBuilder: () => {
      return {
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many requests, please try again later',
        },
      };
    },
  });

  // Multipart (file uploads)
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 5,
    },
  });

  // Static files (for uploaded content)
  await app.register(fastifyStatic, {
    root: path.join(__dirname, '../uploads'),
    prefix: '/uploads/',
  });

  // Swagger documentation
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Portfolio API',
        description: 'Backend API for developer portfolio website',
        version: '1.0.0',
        contact: {
          email: config.admin.email,
        },
      },
      servers: [
        {
          url: config.appUrl,
          description: config.nodeEnv,
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          apiKey: {
            type: 'apiKey',
            name: 'x-api-key',
            in: 'header',
          },
        },
      },
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'projects', description: 'Project management' },
        { name: 'articles', description: 'Blog articles' },
        { name: 'tags', description: 'Content tags' },
        { name: 'contact', description: 'Contact and engagement' },
        { name: 'analytics', description: 'Analytics and tracking' },
        { name: 'admin', description: 'Admin operations' },
        { name: 'health', description: 'Health and status' },
      ],
    },
  });

  // Swagger UI
  await app.register(fastifySwaggerUi, {
    routePrefix: '/api-docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
  });
}

// Global hooks
function registerHooks(app: FastifyInstance): void {
  // Request logging
  app.addHook('onRequest', requestLogger);
  app.addHook('onRequest', addRequestIdHeader);

  // Analytics tracking
  app.addHook('onRequest', analyticsMiddleware);

  // Response logging
  app.addHook('onResponse', responseLogger);
}

/**
 * Build a fully-wired Fastify instance: plugins, hooks and routes registered,
 * nothing listening. The caller decides whether to `listen()` (index.ts) or
 * `inject()` (the e2e suite).
 *
 * Callers must `await app.close()` when done, or the rate-limit plugin's redis
 * handle keeps the process alive.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // We use Pino directly
    trustProxy: true,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
    disableRequestLogging: true,
    ajv: {
      customOptions: {
        // Load-bearing, not cosmetic: `removeAdditional: 'all'` deletes any
        // querystring key a route did not declare, BEFORE the handler runs.
        // Several sweep-5 decisions depend on it -- a field declared only in a
        // zod schema and not in the route's Fastify schema never arrives.
        removeAdditional: 'all',
        coerceTypes: true,
        useDefaults: true,
      },
    },
  });

  // Error handler
  app.setErrorHandler(errorHandler);

  // Not found handler
  app.setNotFoundHandler(notFoundHandler);

  // Order is load-bearing. Fastify applies hooks to routes registered AFTER
  // the hook, so registering routes before hooks would silently leave every
  // route without request logging, request-id headers and analytics context.
  await registerPlugins(app);
  registerHooks(app);
  await registerRoutes(app);

  return app;
}
