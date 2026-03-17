import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError, ZodSchema } from 'zod';
import { ApiError } from '../utils/errors.js';
import { createLogger } from '../config/logger.js';

const logger = createLogger('error-handler');

// Global error handler
export const errorHandler = (
  error: Error,
  _request: FastifyRequest,
  reply: FastifyReply
): void => {
  // Log the error
  logger.error({ error, stack: error.stack }, 'Request error');

  // Handle ApiError
  if (error instanceof ApiError) {
    reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
    });
    return;
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { errors: formattedErrors },
      },
    });
    return;
  }

  // Handle Prisma errors
  if (error.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as unknown as { code: string; meta?: { target?: string[] } };
    
    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        reply.status(409).send({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'A record with this value already exists',
            details: { field: prismaError.meta?.target?.[0] },
          },
        });
        return;
      case 'P2025': // Record not found
        reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Record not found',
          },
        });
        return;
      default:
        break;
    }
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token',
      },
    });
    return;
  }

  // Default 500 error
  reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};

// Validation middleware factory
export const validate = <T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') => {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const data = source === 'body' ? request.body : source === 'query' ? request.query : request.params;
    
    try {
      const validated = schema.parse(data);
      
      // Attach validated data back to request
      if (source === 'body') {
        request.body = validated;
      } else if (source === 'query') {
        (request as FastifyRequest & { validatedQuery: T }).validatedQuery = validated;
      } else {
        (request as FastifyRequest & { validatedParams: T }).validatedParams = validated;
      }
    } catch (error) {
      if (error instanceof ZodError) {
        throw ApiError.validation(
          error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        );
      }
      throw error;
    }
  };
};

// Not found handler
export const notFoundHandler = (_request: FastifyRequest, reply: FastifyReply): void => {
  reply.status(404).send({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  });
};
