import Fastify from 'fastify';
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
import { logger } from './config/logger.js';
import { connectDatabase } from './config/database.js';
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
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Fastify app
const app = Fastify({
  logger: false, // We use Pino directly
  trustProxy: true,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'reqId',
  disableRequestLogging: true,
  ajv: {
    customOptions: {
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

// Plugins
async function registerPlugins(): Promise<void> {
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
      return request.headers['x-forwarded-for'] as string || request.ip;
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
function registerHooks(): void {
  // Request logging
  app.addHook('onRequest', requestLogger);
  app.addHook('onRequest', addRequestIdHeader);

  // Analytics tracking
  app.addHook('onRequest', analyticsMiddleware);

  // Response logging
  app.addHook('onResponse', responseLogger);
}

// Graceful shutdown
function setupGracefulShutdown(): void {
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

  signals.forEach((signal) => {
    process.on(signal, async () => {
      logger.info(`Received ${signal}, starting graceful shutdown`);

      try {
        await app.close();
        await redis.quit();
        logger.info('Server closed successfully');
        process.exit(0);
      } catch (error) {
        logger.error({ error }, 'Error during shutdown');
        process.exit(1);
      }
    });
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'Unhandled rejection');
  });

  process.on('uncaughtException', (error) => {
    logger.error({ error }, 'Uncaught exception');
    process.exit(1);
  });
}

// Start server
async function start(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connection established');

    // Register plugins
    await registerPlugins();
    logger.info('Plugins registered');

    // Register hooks
    registerHooks();
    logger.info('Hooks registered');

    // Register routes
    await registerRoutes(app);
    logger.info('Routes registered');

    // Setup graceful shutdown
    setupGracefulShutdown();

    // Start listening
    await app.listen({
      port: config.port,
      host: config.host,
    });

    logger.info(
      {
        port: config.port,
        host: config.host,
        env: config.nodeEnv,
        url: config.appUrl,
      },
      '🚀 Portfolio API started successfully'
    );

    // Log API docs URL
    logger.info(`📚 API Documentation: ${config.appUrl}/api-docs`);
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Start the server
start();

export default app;
