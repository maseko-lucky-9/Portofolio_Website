import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { ApiError } from '../utils/errors.js';
import { securityConfig } from '../config/security.js';

// In-memory CSRF token store (use Redis in production)
const csrfTokens = new Map<string, { token: string; createdAt: number }>();

// Clean up old tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour

  for (const [key, value] of csrfTokens.entries()) {
    if (now - value.createdAt > maxAge) {
      csrfTokens.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Store CSRF token for a session
 */
export function storeCsrfToken(sessionId: string, token: string): void {
  csrfTokens.set(sessionId, {
    token,
    createdAt: Date.now(),
  });
}

/**
 * Verify CSRF token
 */
export function verifyCsrfToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  
  if (!stored) {
    return false;
  }

  // Check if token matches
  if (stored.token !== token) {
    return false;
  }

  // Check if token is not expired (1 hour)
  const age = Date.now() - stored.createdAt;
  if (age > 60 * 60 * 1000) {
    csrfTokens.delete(sessionId);
    return false;
  }

  return true;
}

/**
 * CSRF protection middleware
 * 
 * Uses double-submit cookie pattern:
 * 1. Server sets a random CSRF token in a cookie
 * 2. Client must include the same token in request header
 * 3. Server verifies both match for state-changing requests
 */
export async function csrfProtection(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const method = request.method;
  const path = request.routerPath || request.url;

  // Skip CSRF check for:
  // 1. Safe methods (GET, HEAD, OPTIONS)
  // 2. Excluded paths
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  const isExcluded = securityConfig.csrf.excludePaths.some((excluded) =>
    path.startsWith(excluded)
  );

  if (safeMethods.includes(method) || isExcluded) {
    return;
  }

  // Get CSRF token from cookie
  const cookieToken = request.cookies[securityConfig.csrf.cookieName];

  // Get CSRF token from header
  const headerToken = request.headers[securityConfig.csrf.headerName.toLowerCase()] as string;

  // Both must be present
  if (!cookieToken || !headerToken) {
    throw ApiError.forbidden('CSRF token missing');
  }

  // Tokens must match
  if (cookieToken !== headerToken) {
    throw ApiError.forbidden('Invalid CSRF token');
  }

  // Get session ID for token validation
  const sessionId = request.cookies['sessionId'] || request.headers['x-session-id'] as string || 'anonymous';

  // Verify token is valid and not expired
  if (!verifyCsrfToken(sessionId, cookieToken)) {
    throw ApiError.forbidden('CSRF token expired or invalid');
  }
}

/**
 * Generate and set CSRF token
 * Call this when creating a session or on first request
 */
export function setCsrfToken(request: FastifyRequest, reply: FastifyReply): string {
  const token = generateCsrfToken();
  const sessionId = request.cookies['sessionId'] || request.headers['x-session-id'] as string || 'anonymous';

  // Store token
  storeCsrfToken(sessionId, token);

  // Set cookie
  reply.cookie(securityConfig.csrf.cookieName, token, {
    httpOnly: false, // Must be readable by client
    secure: securityConfig.cookie.secure,
    sameSite: securityConfig.cookie.sameSite,
    path: '/',
    maxAge: 60 * 60, // 1 hour
  });

  return token;
}

/**
 * Get CSRF token endpoint
 * Clients can call this to get a fresh token
 */
export async function getCsrfToken(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<{ token: string }> {
  const token = setCsrfToken(request, reply);
  return { token };
}
