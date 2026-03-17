import { FastifyInstance } from 'fastify';
import { authService } from '../../services/auth.service.js';
import { validate } from '../../middleware/error.middleware.js';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { loginSchema, registerSchema, refreshTokenSchema, changePasswordSchema } from '../../utils/validation.js';
import { createAuditLog } from '../../middleware/audit.middleware.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Register
  app.post('/register', {
    preHandler: [validate(registerSchema)],
    schema: {
      tags: ['auth'],
      description: 'Register a new user account',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const result = await authService.register(request.body as { email: string; password: string; firstName?: string; lastName?: string });
    
    await createAuditLog(request, 'CREATE', 'User', result.user.id);
    
    reply.code(201).send({
      success: true,
      data: result,
    });
  });

  // Login
  app.post('/login', {
    preHandler: [validate(loginSchema)],
    schema: {
      tags: ['auth'],
      description: 'Login with email and password',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const result = await authService.login(request.body as { email: string; password: string });
    
    await createAuditLog(request, 'LOGIN', 'User', result.user.id);
    
    reply.send({
      success: true,
      data: result,
    });
  });

  // Refresh token
  app.post('/refresh', {
    preHandler: [validate(refreshTokenSchema)],
    schema: {
      tags: ['auth'],
      description: 'Refresh access token using refresh token',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };
    const tokens = await authService.refreshToken(refreshToken);
    
    reply.send({
      success: true,
      data: tokens,
    });
  });

  // Logout
  app.post('/logout', {
    preHandler: [authenticate, validate(refreshTokenSchema)],
    schema: {
      tags: ['auth'],
      description: 'Logout and revoke refresh token',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };
    await authService.logout(refreshToken);
    
    await createAuditLog(request, 'LOGOUT', 'User', (request as unknown as AuthenticatedRequest).user.id);
    
    reply.send({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  });

  // Get profile
  app.get('/profile', {
    preHandler: [authenticate],
    schema: {
      tags: ['auth'],
      description: 'Get current user profile',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const user = (request as unknown as AuthenticatedRequest).user;
    const profile = await authService.getProfile(user.id);
    
    reply.send({
      success: true,
      data: profile,
    });
  });

  // Update profile
  app.patch('/profile', {
    preHandler: [authenticate],
    schema: {
      tags: ['auth'],
      description: 'Update user profile',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          avatar: { type: 'string', format: 'uri' },
          bio: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const user = (request as unknown as AuthenticatedRequest).user;
    const updated = await authService.updateProfile(user.id, request.body as { firstName?: string; lastName?: string; avatar?: string; bio?: string });
    
    await createAuditLog(request, 'UPDATE', 'User', user.id, undefined, updated);
    
    reply.send({
      success: true,
      data: updated,
    });
  });

  // Change password
  app.post('/change-password', {
    preHandler: [authenticate, validate(changePasswordSchema)],
    schema: {
      tags: ['auth'],
      description: 'Change user password',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 8 },
        },
      },
    },
  }, async (request, reply) => {
    const user = (request as unknown as AuthenticatedRequest).user;
    const { currentPassword, newPassword } = request.body as { currentPassword: string; newPassword: string };
    
    await authService.changePassword(user.id, currentPassword, newPassword);
    
    await createAuditLog(request, 'PASSWORD_CHANGE', 'User', user.id);
    
    reply.send({
      success: true,
      data: { message: 'Password changed successfully' },
    });
  });
}
