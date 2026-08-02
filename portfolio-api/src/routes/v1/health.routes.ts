import { FastifyInstance } from 'fastify';
import { checkDatabaseHealth } from '../../config/database.js';
import { redis } from '../../config/redis.js';
import { getRealtimeVisitors } from '../../middleware/analytics.middleware.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  // Basic health check
  app.get('/', async () => {
    const [dbHealthy, redisHealthy] = await Promise.all([
      checkDatabaseHealth(),
      redis.ping().then(() => true).catch(() => false),
    ]);

    const healthy = dbHealthy && redisHealthy;

    return {
      success: true,
      data: {
        status: healthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealthy ? 'up' : 'down',
          redis: redisHealthy ? 'up' : 'down',
        },
      },
    };
  });

  // Detailed health check
  app.get('/detailed', async () => {
    const startTime = Date.now();
    
    const [dbHealthy, redisHealthy, realtimeVisitors] = await Promise.all([
      checkDatabaseHealth(),
      redis.ping().then(() => true).catch(() => false),
      getRealtimeVisitors(),
    ]);

    const responseTime = Date.now() - startTime;
    const healthy = dbHealthy && redisHealthy;

    return {
      success: true,
      data: {
        status: healthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime: `${responseTime}ms`,
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        },
        services: {
          database: dbHealthy ? 'up' : 'down',
          redis: redisHealthy ? 'up' : 'down',
        },
        metrics: {
          realtimeVisitors,
        },
      },
    };
  });

  // Readiness probe
  app.get('/ready', async (_request, reply) => {
    const healthy = await checkDatabaseHealth();
    
    if (healthy) {
      return { success: true, data: { ready: true } };
    }
    
    reply.code(503).send({ success: false, error: { code: 'NOT_READY', message: 'Service not ready' } });
  });

  // Liveness probe
  app.get('/live', async () => {
    return { success: true, data: { alive: true } };
  });
}
