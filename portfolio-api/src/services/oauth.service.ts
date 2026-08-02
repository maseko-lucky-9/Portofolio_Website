import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { ApiError } from '../utils/errors.js';
import { generateTokens } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

// OAuth provider types
export type OAuthProvider = 'github' | 'google';

// OAuth profile interface
export interface OAuthProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  username?: string;
}

export class OAuthService {
  /**
   * Handle OAuth callback - authenticate or link account
   */
  async handleOAuthCallback(
    provider: OAuthProvider,
    profile: OAuthProfile,
    accessToken: string,
    refreshToken?: string
  ): Promise<{
    user: {
      id: string;
      email: string;
      role: Role;
      firstName: string | null;
      lastName: string | null;
    };
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  }> {
    // Check if OAuth provider account exists
    const oauthAccount = await prisma.oAuthProvider.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId: profile.id,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
    });

    let user;
    let isNewUser = false;

    if (oauthAccount) {
      // Existing OAuth account - login
      if (!oauthAccount.user.isActive) {
        throw ApiError.unauthorized('User account is inactive');
      }

      user = oauthAccount.user;

      // Update OAuth tokens
      await prisma.oAuthProvider.update({
        where: { id: oauthAccount.id },
        data: {
          accessToken,
          refreshToken,
          email: profile.email,
          profile: profile as any,
          updatedAt: new Date(),
        },
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    } else {
      // Check if user with this email exists
      const existingUser = await prisma.user.findUnique({
        where: { email: profile.email },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          isActive: true,
        },
      });

      if (existingUser) {
        // Link OAuth to existing user
        if (!existingUser.isActive) {
          throw ApiError.unauthorized('User account is inactive');
        }

        await prisma.oAuthProvider.create({
          data: {
            userId: existingUser.id,
            provider,
            providerId: profile.id,
            email: profile.email,
            accessToken,
            refreshToken,
            profile: profile as any,
          },
        });

        user = existingUser;

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      } else {
        // Create new user
        isNewUser = true;

        const [firstName = '', lastName = ''] = (profile.name || '').split(' ', 2);

        const newUser = await prisma.user.create({
          data: {
            email: profile.email,
            passwordHash: '', // No password for OAuth-only users
            firstName: firstName || null,
            lastName: lastName || null,
            avatar: profile.avatarUrl || null,
            role: Role.VIEWER,
            oauthProviders: {
              create: {
                provider,
                providerId: profile.id,
                email: profile.email,
                accessToken,
                refreshToken,
                profile: profile as any,
              },
            },
          },
          select: {
            id: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true,
          },
        });

        user = newUser;
      }
    }

    // Generate JWT tokens
    const tokens = generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isNewUser,
    };
  }

  /**
   * Link OAuth provider to existing authenticated user
   */
  async linkOAuthProvider(
    userId: string,
    provider: OAuthProvider,
    profile: OAuthProfile,
    accessToken: string,
    refreshToken?: string
  ): Promise<void> {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('User');
    }

    // Check if OAuth account is already linked
    const existingOAuth = await prisma.oAuthProvider.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId: profile.id,
        },
      },
    });

    if (existingOAuth) {
      if (existingOAuth.userId === userId) {
        throw ApiError.conflict('OAuth provider already linked to this account');
      } else {
        throw ApiError.conflict('OAuth provider already linked to another account');
      }
    }

    // Link OAuth provider
    await prisma.oAuthProvider.create({
      data: {
        userId,
        provider,
        providerId: profile.id,
        email: profile.email,
        accessToken,
        refreshToken,
        profile: profile as any,
      },
    });
  }

  /**
   * Unlink OAuth provider from user
   */
  async unlinkOAuthProvider(userId: string, provider: OAuthProvider): Promise<void> {
    const oauthAccount = await prisma.oAuthProvider.findFirst({
      where: {
        userId,
        provider,
      },
    });

    if (!oauthAccount) {
      throw ApiError.notFound('OAuth provider not linked');
    }

    // Check if user has a password (prevent account lockout)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    const hasOtherAuth = user && user.passwordHash && user.passwordHash !== '';

    const otherOAuthProviders = await prisma.oAuthProvider.count({
      where: {
        userId,
        provider: { not: provider },
      },
    });

    if (!hasOtherAuth && otherOAuthProviders === 0) {
      throw ApiError.badRequest(
        'Cannot unlink the only authentication method. Please set a password first.'
      );
    }

    // Unlink
    await prisma.oAuthProvider.delete({
      where: { id: oauthAccount.id },
    });
  }

  /**
   * Get OAuth providers for user
   */
  async getUserOAuthProviders(userId: string): Promise<
    Array<{
      provider: string;
      email: string | null;
      linkedAt: Date;
    }>
  > {
    const providers = await prisma.oAuthProvider.findMany({
      where: { userId },
      select: {
        provider: true,
        email: true,
        createdAt: true,
      },
    });

    return providers.map((p) => ({
      provider: p.provider,
      email: p.email,
      linkedAt: p.createdAt,
    }));
  }

  /**
   * Store refresh token
   */
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

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(provider: OAuthProvider, state: string): string {
    const redirectUri = this.getRedirectUri(provider);

    switch (provider) {
      case 'github':
        const githubParams = new URLSearchParams({
          client_id: config.oauth.github.clientId,
          redirect_uri: redirectUri,
          scope: 'read:user user:email',
          state,
        });
        return `https://github.com/login/oauth/authorize?${githubParams.toString()}`;

      case 'google':
        const googleParams = new URLSearchParams({
          client_id: config.oauth.google.clientId,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: 'openid email profile',
          state,
          access_type: 'offline',
          prompt: 'consent',
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${googleParams.toString()}`;

      default:
        throw ApiError.badRequest('Unsupported OAuth provider');
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    provider: OAuthProvider,
    code: string
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    const redirectUri = this.getRedirectUri(provider);

    switch (provider) {
      case 'github':
        const githubResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: config.oauth.github.clientId,
            client_secret: config.oauth.github.clientSecret,
            code,
            redirect_uri: redirectUri,
          }),
        });

        const githubData = await githubResponse.json() as any;

        if (githubData.error) {
          throw ApiError.badRequest(`GitHub OAuth error: ${githubData.error_description}`);
        }

        return {
          accessToken: githubData.access_token,
          refreshToken: githubData.refresh_token,
        };

      case 'google':
        const googleResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: config.oauth.google.clientId,
            client_secret: config.oauth.google.clientSecret,
            code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });

        const googleData = await googleResponse.json() as any;

        if (googleData.error) {
          throw ApiError.badRequest(`Google OAuth error: ${googleData.error_description}`);
        }

        return {
          accessToken: googleData.access_token,
          refreshToken: googleData.refresh_token,
        };

      default:
        throw ApiError.badRequest('Unsupported OAuth provider');
    }
  }

  /**
   * Get user profile from OAuth provider
   */
  async getOAuthProfile(provider: OAuthProvider, accessToken: string): Promise<OAuthProfile> {
    switch (provider) {
      case 'github':
        const githubUserResponse = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        const githubUser = await githubUserResponse.json() as any;

        // Get primary email
        const githubEmailResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        const githubEmails = await githubEmailResponse.json() as any[];
        const primaryEmail = githubEmails.find((e: any) => e.primary)?.email || githubUser.email;

        return {
          id: String(githubUser.id),
          email: primaryEmail,
          name: githubUser.name,
          avatarUrl: githubUser.avatar_url,
          username: githubUser.login,
        };

      case 'google':
        const googleUserResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const googleUser = await googleUserResponse.json() as any;

        return {
          id: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          avatarUrl: googleUser.picture,
        };

      default:
        throw ApiError.badRequest('Unsupported OAuth provider');
    }
  }

  /**
   * Get OAuth redirect URI
   */
  private getRedirectUri(provider: OAuthProvider): string {
    const baseUrl = config.apiUrl || 'http://localhost:3000';
    return `${baseUrl}/api/v1/auth/oauth/${provider}/callback`;
  }
}

export const oauthService = new OAuthService();
