import { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { contactService } from '../../services/contact.service.js';
import { newsletterService } from '../../services/newsletter.service.js';

export async function contactRoutes(app: FastifyInstance): Promise<void> {
  // Submit contact form
  app.post('/submit', {
    schema: {
      description: 'Submit a contact form',
      tags: ['Contact'],
      body: {
        type: 'object',
        required: ['name', 'email', 'message'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          company: { type: 'string' },
          phone: { type: 'string' },
          subject: { type: 'string' },
          message: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request) => {
    const data = request.body as any;
    const metadata = {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      referer: request.headers.referer,
    };
    const result = await contactService.submitContact(data, metadata);
    return result;
  });

  // Get all contact submissions (admin)
  app.get('/submissions', {
    preHandler: [authenticate, requireRole('ADMIN')],
    schema: {
      description: 'Get all contact submissions (admin only)',
      tags: ['Contact'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '20' },
          status: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    const query = request.query as any;
    const result = await contactService.getSubmissions({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      status: query.status,
    });
    return result;
  });

  // Update submission status (admin)
  app.patch('/submissions/:id', {
    preHandler: [authenticate, requireRole('ADMIN')],
    schema: {
      description: 'Update contact submission status (admin only)',
      tags: ['Contact'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string' },
          notes: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    const { id } = request.params as { id: string };
    const { status, notes } = request.body as any;
    const result = await contactService.updateSubmissionStatus(id, status, notes);
    return result;
  });

  // Newsletter signup
  app.post('/newsletter', {
    schema: {
      description: 'Subscribe to newsletter',
      tags: ['Newsletter'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          metadata: { type: 'object' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request) => {
    const data = request.body as any;
    const result = await newsletterService.subscribe(data);
    return result;
  });

  // Confirm newsletter subscription
  app.get('/newsletter/confirm/:token', {
    schema: {
      description: 'Confirm newsletter subscription',
      tags: ['Newsletter'],
      params: {
        type: 'object',
        required: ['token'],
        properties: { token: { type: 'string' } },
      },
    },
  }, async (request) => {
    const { token } = request.params as { token: string };
    const result = await newsletterService.confirmSubscription(token);
    return result;
  });

  // Unsubscribe from newsletter
  app.get('/newsletter/unsubscribe/:token', {
    schema: {
      description: 'Unsubscribe from newsletter',
      tags: ['Newsletter'],
      params: {
        type: 'object',
        required: ['token'],
        properties: { token: { type: 'string' } },
      },
    },
  }, async (request) => {
    const { token } = request.params as { token: string };
    const result = await newsletterService.unsubscribe(token);
    return result;
  });

  // Get newsletter subscribers (admin)
  app.get('/newsletter/subscribers', {
    preHandler: [authenticate, requireRole('ADMIN')],
    schema: {
      description: 'Get newsletter subscribers (admin only)',
      tags: ['Newsletter'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '20' },
          status: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    const query = request.query as any;
    const result = await newsletterService.getSubscribers({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      active: query.active === 'true' ? true : query.active === 'false' ? false : undefined,
    });
    return result;
  });

  // Get newsletter stats (admin)
  app.get('/newsletter/stats', {
    preHandler: [authenticate, requireRole('ADMIN')],
    schema: {
      description: 'Get newsletter statistics (admin only)',
      tags: ['Newsletter'],
      security: [{ bearerAuth: [] }],
    },
  }, async () => {
    const stats = await newsletterService.getStats();
    return stats;
  });

  // Get availability status
  app.get('/availability', async () => {
    // TODO: Implement real availability checking from database
    return { 
      isAvailable: true,
      message: 'Currently available for new projects',
      nextAvailable: null,
    };
  });
}
