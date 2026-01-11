import { FastifyRequest, FastifyReply } from 'fastify';
import { createLogger } from '../config/logger.js';
import { nanoid } from 'nanoid';

const logger = createLogger('request');

// Request context stored in a WeakMap to avoid modifying request object
const requestContextMap = new WeakMap<FastifyRequest, {
  requestId: string;
  startTime: number;
}>();

// Request logging middleware
export const requestLogger = async (
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
  const requestId = (request.headers['x-request-id'] as string) || nanoid();
  const startTime = Date.now();

  // Store context in WeakMap
  requestContextMap.set(request, {
    requestId,
    startTime,
  });

  // Log incoming request
  logger.info(
    {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    },
    'Incoming request'
  );
};

// Response logging hook
export const responseLogger = (
  request: FastifyRequest,
  reply: FastifyReply,
  done: () => void
): void => {
  const context = requestContextMap.get(request);
  const duration = Date.now() - (context?.startTime || Date.now());

  logger.info(
    {
      requestId: context?.requestId,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration: `${duration}ms`,
    },
    'Request completed'
  );

  done();
};

// Add request ID to response headers
export const addRequestIdHeader = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const context = requestContextMap.get(request);
  if (context?.requestId) {
    reply.header('x-request-id', context.requestId);
  }
};

// Cache control headers
export const setCacheHeaders = (maxAge: number, isPrivate: boolean = false) => {
  return async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const cacheControl = isPrivate
      ? `private, max-age=${maxAge}`
      : `public, max-age=${maxAge}, s-maxage=${maxAge}`;
    
    reply.header('Cache-Control', cacheControl);
  };
};

// No cache headers
export const noCache = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  reply.header('Cache-Control', 'no-store, no-cache, must-revalidate');
  reply.header('Pragma', 'no-cache');
  reply.header('Expires', '0');
};

// Demo mode header (shows cache status)
export const demoCacheHeader = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  // This would be set by cache middleware
  const cacheStatus = (request as FastifyRequest & { cacheStatus?: string }).cacheStatus || 'MISS';
  reply.header('X-Cache-Status', cacheStatus);
};
