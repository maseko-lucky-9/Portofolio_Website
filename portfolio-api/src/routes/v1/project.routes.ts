import { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { projectService } from '../../services/project.service.js';
import type { PaginatedResponse, ProjectSummary, ProjectDetail, QueryParams } from '@portfolio/shared/types';
import { paginatedResponse, successResponse } from '../../utils/response.js';

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  // List projects (public)
  app.get('/', {
    schema: {
      description: 'Get all projects with optional filters',
      tags: ['Projects'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '10' },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
          featured: { type: 'string' },
          tag: { type: 'string' },
          search: { type: 'string' },
          sortBy: { type: 'string' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array' },
            meta: { type: 'object' },
          },
        },
      },
    },
  }, async (request, reply): Promise<PaginatedResponse<ProjectSummary>> => {
    const query = request.query as QueryParams;
    const result = await projectService.listProjects({
      page: parseInt(query.page?.toString() || '1'),
      limit: parseInt(query.limit?.toString() || '10'),
      status: query.status as any,
      featured: (query.featured as any) === 'true' ? true : (query.featured as any) === 'false' ? false : undefined,
      tag: query.tag as string | undefined,
      search: query.search as string | undefined,
      sortBy: (query.sortBy as string) || 'createdAt',
      sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc',
    });
    
    const baseUrl = `${request.protocol}://${request.headers.host || request.hostname}/api/v1/projects`;
    return paginatedResponse<ProjectSummary>(
      result.items as ProjectSummary[],
      {
        page: result.meta.page,
        limit: result.meta.limit,
        total: result.meta.total,
        pages: result.meta.totalPages,
        hasNext: result.meta.page < result.meta.totalPages,
        hasPrev: result.meta.page > 1,
      },
      baseUrl
    );
  });

  // Get project by slug (public)
  app.get('/:slug', {
    schema: {
      description: 'Get a single project by slug',
      tags: ['Projects'],
      params: {
        type: 'object',
        required: ['slug'],
        properties: {
          slug: { type: 'string' },
        },
      },
      response: {
        200: { type: 'object' },
      },
    },
  }, async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const project = await projectService.getProjectBySlug(slug);
    return successResponse<ProjectDetail>(project as ProjectDetail);
  });

  // Create project (admin)
  app.post('/', {
    preHandler: [authenticate, requireRole('ADMIN')],
    schema: {
      description: 'Create a new project (admin only)',
      tags: ['Projects'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['slug', 'title', 'description', 'content'],
        properties: {
          slug: { type: 'string' },
          title: { type: 'string' },
          subtitle: { type: 'string' },
          description: { type: 'string' },
          content: { type: 'string' },
          excerpt: { type: 'string' },
          techStack: { type: 'array', items: { type: 'string' } },
          category: { type: 'string' },
          client: { type: 'string' },
          year: { type: 'number' },
          duration: { type: 'string' },
          githubUrl: { type: 'string' },
          liveUrl: { type: 'string' },
          demoUrl: { type: 'string' },
          thumbnail: { type: 'string' },
          images: { type: 'array', items: { type: 'string' } },
          videoUrl: { type: 'string' },
          featured: { type: 'boolean' },
          sortOrder: { type: 'number' },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
          metaTitle: { type: 'string' },
          metaDescription: { type: 'string' },
          tagIds: { type: 'array', items: { type: 'string' } },
        },
      },
      response: {
        201: { type: 'object' },
      },
    },
  }, async (request, reply) => {
    const data = request.body as any;
    const project = await projectService.createProject(data, (request as any).user?.id || '');
    return reply.code(201).send(project);
  });

  // Update project (admin)
  app.put('/:id', {
    preHandler: [authenticate, requireRole('ADMIN')],
    schema: {
      description: 'Update a project (admin only)',
      tags: ['Projects'],
      security: [{ bearerAuth: [] }],
      params: { 
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
      body: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
          title: { type: 'string' },
          subtitle: { type: 'string' },
          description: { type: 'string' },
          content: { type: 'string' },
          excerpt: { type: 'string' },
          techStack: { type: 'array', items: { type: 'string' } },
          category: { type: 'string' },
          client: { type: 'string' },
          year: { type: 'number' },
          duration: { type: 'string' },
          githubUrl: { type: 'string' },
          liveUrl: { type: 'string' },
          demoUrl: { type: 'string' },
          thumbnail: { type: 'string' },
          images: { type: 'array', items: { type: 'string' } },
          videoUrl: { type: 'string' },
          featured: { type: 'boolean' },
          sortOrder: { type: 'number' },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
          metaTitle: { type: 'string' },
          metaDescription: { type: 'string' },
          tagIds: { type: 'array', items: { type: 'string' } },
        },
      },
      response: {
        200: { type: 'object' },
      },
    },
  }, async (request) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const project = await projectService.updateProject(id, data);
    return project;
  });

  // Delete project (admin)
  app.delete('/:id', {
    preHandler: [authenticate, requireRole('ADMIN')],
    schema: {
      description: 'Delete a project (admin only)',
      tags: ['Projects'],
      security: [{ bearerAuth: [] }],
      params: { 
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
      response: {
        204: { type: 'null' },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await projectService.deleteProject(id);
    return reply.code(204).send();
  });
}
