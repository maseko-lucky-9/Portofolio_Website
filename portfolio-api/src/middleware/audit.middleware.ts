import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';
import { createLogger } from '../config/logger.js';
import { AuthenticatedRequest } from './auth.middleware.js';

const logger = createLogger('audit');

// Audit action types
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'API_KEY_CREATE'
  | 'API_KEY_REVOKE'
  | 'SETTINGS_UPDATE'
  | 'EXPORT'
  | 'IMPORT';

// Audit entity types
export type AuditEntity =
  | 'User'
  | 'Project'
  | 'Article'
  | 'Tag'
  | 'Contact'
  | 'Newsletter'
  | 'Demo'
  | 'ApiKey'
  | 'Settings'
  | 'Availability';

// Create audit log entry
export const createAuditLog = async (
  request: FastifyRequest,
  action: AuditAction,
  entity: AuditEntity,
  entityId?: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
): Promise<void> => {
  try {
    const user = (request as AuthenticatedRequest).user;
    
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        oldValues: (oldValues ?? undefined) as Prisma.InputJsonValue | undefined,
        newValues: (newValues ?? undefined) as Prisma.InputJsonValue | undefined,
        userId: user?.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      },
    });

    logger.info(
      {
        action,
        entity,
        entityId,
        userId: user?.id,
      },
      'Audit log created'
    );
  } catch (error) {
    logger.error({ error, action, entity }, 'Failed to create audit log');
  }
};

// Audit middleware factory - automatically logs mutations
export const auditMiddleware = (action: AuditAction, entity: AuditEntity) => {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    // Store original values for UPDATE actions
    if (action === 'UPDATE' || action === 'DELETE') {
      const params = request.params as { id?: string; slug?: string };
      const id = params.id || params.slug;

      if (id) {
        // Store entity ID for post-response audit logging
        (request as FastifyRequest & { auditContext: { action: AuditAction; entity: AuditEntity; entityId: string } }).auditContext = {
          action,
          entity,
          entityId: id,
        };
      }
    }
  };
};

// Diff two objects and return changes
export const diffObjects = (
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>
): { old: Record<string, unknown>; new: Record<string, unknown> } => {
  const oldChanges: Record<string, unknown> = {};
  const newChanges: Record<string, unknown> = {};

  // Find changed or removed fields
  for (const key of Object.keys(oldObj)) {
    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      oldChanges[key] = oldObj[key];
      if (key in newObj) {
        newChanges[key] = newObj[key];
      }
    }
  }

  // Find added fields
  for (const key of Object.keys(newObj)) {
    if (!(key in oldObj)) {
      newChanges[key] = newObj[key];
    }
  }

  return { old: oldChanges, new: newChanges };
};

// Get recent audit logs
export const getAuditLogs = async (options: {
  userId?: string;
  entity?: AuditEntity;
  entityId?: string;
  action?: AuditAction;
  limit?: number;
  offset?: number;
}): Promise<{
  logs: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    userId: string | null;
    createdAt: Date;
    user?: { email: string } | null;
  }>;
  total: number;
}> => {
  const where = {
    ...(options.userId && { userId: options.userId }),
    ...(options.entity && { entity: options.entity }),
    ...(options.entityId && { entityId: options.entityId }),
    ...(options.action && { action: options.action }),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
      skip: options.offset || 0,
      include: {
        user: {
          select: { email: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
};
