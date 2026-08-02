import { FastifyInstance } from 'fastify';
import { getRealtimeVisitors } from '../../middleware/analytics.middleware.js';

export function analyticsRoutes(app: FastifyInstance): void {
  app.get('/realtime', async () => {
    const visitors = await getRealtimeVisitors();
    return { success: true, data: { visitors } };
  });

  app.post('/track', () => ({
    success: true,
    data: {},
    message: 'Track event - implementation in progress',
  }));
}
