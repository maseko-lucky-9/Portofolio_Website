import { FastifyInstance } from 'fastify';

export function adminRoutes(app: FastifyInstance): void {
  app.get('/stats', () => ({
    success: true,
    data: { stats: {} },
    message: 'Admin stats - implementation in progress',
  }));
  app.get('/audit-logs', () => ({
    success: true,
    data: { logs: [] },
    message: 'Audit logs - implementation in progress',
  }));
}
