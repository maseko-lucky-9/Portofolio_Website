import { FastifyInstance } from 'fastify';

export async function tagRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', async () => ({ success: true, data: [], message: 'Tag routes - implementation in progress' }));
  app.post('/', async () => ({ success: true, data: {}, message: 'Create tag - implementation in progress' }));
}
