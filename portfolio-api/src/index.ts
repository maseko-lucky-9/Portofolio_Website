import { FastifyInstance } from 'fastify';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { connectDatabase } from './config/database.js';
import { redis } from './config/redis.js';
import { buildApp } from './app.js';

// Process entrypoint. Everything that wires the app itself lives in app.ts --
// what stays here is the part a test must NOT run: connecting the database,
// binding a listener, and installing process-wide signal handlers.

// Graceful shutdown
//
// Deliberately not part of buildApp(): this registers process-level listeners,
// and the e2e suite builds an app per file. Registering these there would leak
// a handler set per built app and trip Node's max-listeners warning.
function setupGracefulShutdown(app: FastifyInstance): void {
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
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
  };

  signals.forEach((signal) => {
    // process.on expects a void-returning listener. Handing it an async function
    // means any rejection escaping `shutdown` is swallowed by the event emitter
    // instead of surfacing. Calling it here and marking the promise `void` keeps
    // the listener synchronous and makes the fire-and-forget deliberate.
    process.on(signal, () => {
      void shutdown(signal);
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
    // Connect to database FIRST, before anything binds a port -- an unreachable
    // database should fail the boot, not surface as 500s on a live listener.
    await connectDatabase();
    logger.info('Database connection established');

    // Build the app (plugins, hooks, routes)
    const app = await buildApp();
    logger.info('App built: plugins, hooks and routes registered');

    // Setup graceful shutdown
    setupGracefulShutdown(app);

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

// Start the server. `void` rather than a .catch(): start() already wraps its whole
// body in a try/catch that logs and process.exit(1)s, so it cannot reject in
// practice -- a .catch() here would be unreachable code pretending to be a safety net.
void start();
