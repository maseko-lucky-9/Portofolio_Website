import { prisma } from '../config/database.js';
import { hashPassword, verifyPassword, generateToken } from '../utils/crypto.js';
import { generateTokens } from '../middleware/auth.middleware.js';
import { ApiError } from '../utils/errors.js';
import { Role } from '@prisma/client';
import { LoginInput, RegisterInput } from '../utils/validation.js';

export class AuthService {
  // Register new user
  async register(data: RegisterInput): Promise<{ user: { id: string; email: string; role: Role }; accessToken: string; refreshToken: string }> {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw ApiError.conflict('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: Role.VIEWER, // Default role
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    // Generate tokens
    const tokens = generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // Login
  async login(data: LoginInput): Promise<{ user: { id: string; email: string; role: Role; firstName: string | null; lastName: string | null }; accessToken: string; refreshToken: string }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Verify password
    const valid = await verifyPassword(data.password, user.passwordHash);
    if (!valid) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // Refresh tokens
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify refresh token exists and not revoked
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    if (!stored.user.isActive) {
      throw ApiError.unauthorized('User account is inactive');
    }

    // Generate new tokens
    const tokens = generateTokens(stored.user);

    // Revoke old refresh token
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    // Store new refresh token
    await this.storeRefreshToken(stored.user.id, tokens.refreshToken);

    return tokens;
  }

  // Logout (revoke refresh token)
  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  // Store refresh token
  private async storeRefreshToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  // Get user profile
  async getProfile(userId: string): Promise<{ id: string; email: string; role: Role; firstName: string | null; lastName: string | null; avatar: string | null; bio: string | null; createdAt: Date }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User');
    }

    return user;
  }

  // Update profile
  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; avatar?: string; bio?: string }): Promise<{ id: string; email: string; firstName: string | null; lastName: string | null; avatar: string | null; bio: string | null }> {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
      },
    });

    return user;
  }

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw ApiError.notFound('User');
    }

    // Verify current password
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revoke all refresh tokens for security
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export const authService = new AuthService();
