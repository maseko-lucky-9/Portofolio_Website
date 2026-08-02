import { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { ApiError } from '../utils/errors.js';
import { hashApiKey } from '../utils/crypto.js';
import { Role } from '@prisma/client';

// JWT payload type
export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  type: 'access' | 'refresh';
}

// Extended request with user
export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

// Generate tokens
export const generateTokens = (user: {
  id: string;
  email: string;
  role: Role;
}): {
  accessToken: string;
  refreshToken: string;
} => {
  const accessPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'access',
  };

  const refreshPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'refresh',
  };

  // @types/jsonwebtoken types `expiresIn` as `ms.StringValue | number`, a
  // template-literal union that a plain `string` from the env schema is not
  // assignable to. `ms` is a transitive dependency, so index into SignOptions
  // rather than importing its type directly.
  //
  // This is still an assertion, and it proves nothing about the value: it only
  // narrows the escape hatch from `any` (which disables checking on the whole
  // surrounding expression) to the one option type. JWT_ACCESS_EXPIRY is an
  // unconstrained z.string() in config/index.ts, so a malformed value such as
  // '15minutes' makes ms() return undefined and jwt.sign emit a token with NO
  // exp claim. Constraining the env schema is the real fix and is deliberately
  // left out of this PR -- config failures process.exit(1) at import, which is
  // too blunt a change to bundle with a lint sweep.
  const accessToken = jwt.sign(accessPayload, config.auth.jwtSecret, {
    expiresIn: config.auth.accessExpiry as SignOptions['expiresIn'],
  });

  // `jwtid` is load-bearing, not decorative. refreshPayload is fully
  // deterministic ({userId, email, role, type}), and the only other claim
  // jwt.sign adds is `iat`, which has SECOND granularity. Two refresh tokens
  // minted for the same user within the same second were therefore byte
  // identical -- and RefreshToken.token is @unique, so storeRefreshToken()
  // threw P2002 and the request came back 409 CONFLICT.
  //
  // That broke login outright: register() issues a token, so logging in
  // immediately afterwards (or twice in quick succession) always collided.
  // Found by tests/e2e/auth.test.ts.
  const refreshToken = jwt.sign(refreshPayload, config.auth.jwtSecret, {
    expiresIn: config.auth.refreshExpiry as SignOptions['expiresIn'],
    jwtid: randomUUID(),
  });

  return { accessToken, refreshToken };
};

// Verify JWT token
export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
  } catch (error) {
    if ((error as Error).name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token has expired');
    }
    throw ApiError.unauthorized('Invalid token');
  }
};

// Auth middleware - requires valid JWT
export const authenticate = async (
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('No token provided');
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (payload.type !== 'access') {
    throw ApiError.unauthorized('Invalid token type');
  }

  // Verify user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User not found or inactive');
  }

  // Attach user to request
  (request as AuthenticatedRequest).user = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
};

// Optional auth - attaches user if token provided, but doesn't require it
export const optionalAuth = async (
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return;
  }

  try {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (payload.type !== 'access') {
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (user?.isActive) {
      (request as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    }
  } catch {
    // Silent fail for optional auth
  }
};

// Role-based access control
export const requireRole = (...roles: Role[]) => {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const user = (request as AuthenticatedRequest).user;

    if (!user) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (!roles.includes(user.role)) {
      throw ApiError.forbidden('Insufficient permissions');
    }
  };
};

// Admin only shortcut
export const requireAdmin = requireRole(Role.ADMIN);

// Editor or Admin
export const requireEditor = requireRole(Role.EDITOR, Role.ADMIN);

// Permission-based access control
export const requirePermission = (...permissions: string[]) => {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const user = (request as AuthenticatedRequest).user;

    if (!user) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Import here to avoid circular dependency
    const { getUserPermissions } = await import('../config/permissions.js');
    const userPermissions = getUserPermissions(user.role);

    // Admin has all permissions (check if user is admin)
    if (user.role === Role.ADMIN) {
      return;
    }

    // Check if user has required permissions
    const hasRequiredPermission = permissions.some((perm) =>
      userPermissions.map((p) => p.toString()).includes(perm)
    );

    if (!hasRequiredPermission) {
      throw ApiError.forbidden('Insufficient permissions');
    }
  };
};

// API Key authentication
export const authenticateApiKey = async (
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    throw ApiError.unauthorized('API key required');
  }

  const keyHash = hashApiKey(apiKey);

  const key = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
  });

  if (!key || !key.isActive) {
    throw ApiError.unauthorized('Invalid API key');
  }

  if (key.expiresAt && key.expiresAt < new Date()) {
    throw ApiError.unauthorized('API key has expired');
  }

  if (!key.user.isActive) {
    throw ApiError.unauthorized('User account is inactive');
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  // Attach user to request
  (request as AuthenticatedRequest).user = {
    id: key.user.id,
    email: key.user.email,
    role: key.user.role,
  };
};

// Combined auth (JWT or API key)
export const authenticateAny = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const authHeader = request.headers.authorization;
  const apiKey = request.headers['x-api-key'];

  if (authHeader?.startsWith('Bearer ')) {
    return authenticate(request, reply);
  }

  if (apiKey) {
    return authenticateApiKey(request, reply);
  }

  throw ApiError.unauthorized('Authentication required');
};
