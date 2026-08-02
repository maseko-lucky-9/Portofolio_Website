import { FastifyInstance } from 'fastify';

export function tagRoutes(app: FastifyInstance): void {
  app.get('/', () => ({
    success: true,
    data: [],
    message: 'Tag routes - implementation in progress',
  }));
  app.post('/', () => ({
    success: true,
    data: {},
    message: 'Create tag - implementation in progress',
  }));
}
