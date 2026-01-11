import { FastifyInstance } from 'fastify';
import { getRealtimeVisitors } from '../../middleware/analytics.middleware.js';

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/realtime', async () => {
    const visitors = await getRealtimeVisitors();
    return { success: true, data: { visitors } };
  });
  
  app.post('/track', async () => ({ success: true, data: {}, message: 'Track event - implementation in progress' }));
}
