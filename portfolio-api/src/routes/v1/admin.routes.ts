import { FastifyInstance } from 'fastify';

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.get('/stats', async () => ({ success: true, data: { stats: {} }, message: 'Admin stats - implementation in progress' }));
  app.get('/audit-logs', async () => ({ success: true, data: { logs: [] }, message: 'Audit logs - implementation in progress' }));
}
