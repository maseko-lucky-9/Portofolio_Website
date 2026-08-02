import { z } from 'zod';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { createLogger } from '../config/logger.js';
import { ApiError } from '../utils/errors.js';
import { generateTokens } from '../middleware/auth.middleware.js';
import { Prisma, Role } from '@prisma/client';

const logger = createLogger('oauth');

// ==========================================
// Provider wire formats
// ==========================================
// These describe what GitHub and Google send us, not what this API accepts, so
// they live here rather than in utils/validation.ts.
//
// Deliberately non-strict: zod strips unknown keys, so a provider adding a
// field cannot break login. Fields are required only where the code below
// actually depends on the value -- everything the response returns beyond that
// is the provider's business.

// GitHub and Google return the same four fields we care about from their token
// endpoints, so one schema covers both. Success and failure are distinguished
// by which keys are present, hence everything is optional and the callers
// branch explicitly.
// `access_token` is constrained to a non-empty string because it becomes a
// stored credential. `refresh_token` deliberately is NOT: it is optional and
// nothing depends on its contents, so rejecting '' would turn a cosmetic
// provider oddity into a failed login.
const oauthTokenResponseSchema = z.object({
  access_token: z.string().min(1).optional(),
  refresh_token: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

// GitHub sends `id` as a number; the caller stringifies it.
// `email` is null when the user keeps their address private.
//
// `avatar_url` is deliberately NOT constrained with .url(): it is cosmetic, and
// a provider changing its shape must not be able to fail an otherwise valid
// login. `email` is constrained, because it becomes the account identity.
const githubUserSchema = z.object({
  id: z.union([z.number(), z.string()]),
  email: z.string().email().nullable().optional(),
  name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  login: z.string().nullable().optional(),
});

// Parsed element-wise, not as a whole array. z.array() is all-or-nothing, so a
// single malformed sibling address (no TLD, an IDN domain zod's .email()
// rejects) would discard an otherwise valid verified primary and lock the user
// out. `.catch(null)` degrades the bad element instead of the whole list.
const githubEmailsSchema = z.array(
  z
    .object({
      email: z.string().email(),
      primary: z.boolean().optional(),
      verified: z.boolean().optional(),
    })
    .nullable()
    .catch(null)
);

// `picture` is cosmetic and unconstrained for the same reason as GitHub's
// avatar_url above.
const googleUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  verified_email: z.boolean().optional(),
  name: z.string().nullable().optional(),
  picture: z.string().nullable().optional(),
});

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

// The `profile` column is Json. OAuthProfile is an interface, and TypeScript
// does not give interfaces an implicit index signature, so it is not directly
// assignable to Prisma.InputJsonObject even though its shape is valid JSON.
// Spreading into an object literal yields an anonymous type that is -- which
// keeps this a real conversion rather than an assertion that silences the
// checker without proving anything.
const toJsonProfile = (profile: OAuthProfile): Prisma.InputJsonObject => ({ ...profile });

/**
 * Parse a response from an OAuth provider.
 *
 * A provider response is NOT client input, so a malformed one must not surface
 * as a 400 VALIDATION_ERROR: that reports an upstream outage as caller error
 * (hiding it from any 5xx-based alerting) and echoes the provider's field names
 * back to whoever called us. Log the detail server-side, return a 503.
 */
function parseProviderResponse<T>(schema: z.ZodType<T>, body: unknown, provider: string): T {
  const result = schema.safeParse(body);

  if (!result.success) {
    logger.warn(
      { provider, issues: result.error.issues },
      'Unexpected response from OAuth provider'
    );
    throw ApiError.serviceUnavailable(`${provider} returned an unexpected response`);
  }

  return result.data;
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
          profile: toJsonProfile(profile),
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
            profile: toJsonProfile(profile),
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
                profile: toJsonProfile(profile),
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
        profile: toJsonProfile(profile),
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

    // Equivalent to the previous `user && user.passwordHash && user.passwordHash !== ''`:
    // passwordHash is a non-null String in the schema, so the `!== ''` arm was already
    // redundant behind the truthiness check. Only used as a boolean below.
    const hasOtherAuth = Boolean(user?.passwordHash);

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
      case 'github': {
        const githubParams = new URLSearchParams({
          client_id: config.oauth.github.clientId,
          redirect_uri: redirectUri,
          scope: 'read:user user:email',
          state,
        });
        return `https://github.com/login/oauth/authorize?${githubParams.toString()}`;
      }

      case 'google': {
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
      }

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
      case 'github': {
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

        const githubData = parseProviderResponse(
          oauthTokenResponseSchema,
          await githubResponse.json(),
          'GitHub'
        );

        if (githubData.error) {
          // error_description is optional in the OAuth 2.0 error response, so
          // fall back to the error code rather than interpolating `undefined`.
          throw ApiError.badRequest(
            `GitHub OAuth error: ${githubData.error_description ?? githubData.error}`
          );
        }

        // A response carrying neither `error` nor `access_token` previously
        // stored `undefined` as the account's access token.
        if (!githubData.access_token) {
          throw ApiError.badRequest('GitHub OAuth error: response contained no access token');
        }

        return {
          accessToken: githubData.access_token,
          refreshToken: githubData.refresh_token,
        };
      }

      case 'google': {
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

        const googleData = parseProviderResponse(
          oauthTokenResponseSchema,
          await googleResponse.json(),
          'Google'
        );

        if (googleData.error) {
          throw ApiError.badRequest(
            `Google OAuth error: ${googleData.error_description ?? googleData.error}`
          );
        }

        if (!googleData.access_token) {
          throw ApiError.badRequest('Google OAuth error: response contained no access token');
        }

        return {
          accessToken: googleData.access_token,
          refreshToken: googleData.refresh_token,
        };
      }

      default:
        throw ApiError.badRequest('Unsupported OAuth provider');
    }
  }

  /**
   * Get user profile from OAuth provider
   */
  async getOAuthProfile(provider: OAuthProvider, accessToken: string): Promise<OAuthProfile> {
    switch (provider) {
      case 'github': {
        const githubUserResponse = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        const githubUser = parseProviderResponse(
          githubUserSchema,
          await githubUserResponse.json(),
          'GitHub'
        );

        // Get primary email
        const githubEmailResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        // This endpoint returns an OBJECT, not an array, when the token lacks
        // the user:email scope, so a parse failure means "the address list was
        // unavailable" rather than "the request is bad".
        const githubEmails = githubEmailsSchema.safeParse(await githubEmailResponse.json());

        if (githubEmails.success) {
          const degraded = githubEmails.data.filter((e) => e === null).length;

          if (degraded > 0) {
            logger.warn(
              { provider: 'GitHub', degraded, total: githubEmails.data.length },
              'Unparseable entries in GitHub email list'
            );
          }

          // One bad entry is one odd address. EVERY entry degrading means the
          // element shape changed, which is an upstream fault -- and falling
          // through to the 400 below would tell every user during a total
          // GitHub outage to go verify an address they have already verified.
          // Same treatment parseProviderResponse gives a failed body parse.
          if (degraded > 0 && degraded === githubEmails.data.length) {
            throw ApiError.serviceUnavailable('GitHub returned an unexpected response');
          }
        }

        // Only a verified address is acceptable. handleOAuthCallback looks an
        // incoming profile up by email and links it to any existing user with
        // that address, so honouring an unverified one would let anyone who
        // adds a victim's address to their own GitHub account take over the
        // victim's login here.
        //
        // The two branches are NOT interchangeable, and this must not collapse
        // into `?? githubUser.email`: falling back when the list WAS readable
        // but held no verified primary would re-admit the exact unverified
        // address the filter just rejected. The public profile email is used
        // only when the list could not be read at all -- GitHub requires an
        // address to be verified before it can be made public.
        const primaryEmail = githubEmails.success
          ? githubEmails.data.find((e) => e?.primary && e?.verified)?.email
          : githubUser.email;

        // Previously this produced `email: undefined` against a declared
        // `email: string`, which then reached prisma.user.create() as a null
        // value for a non-null unique column.
        if (!primaryEmail) {
          throw ApiError.badRequest(
            'GitHub returned no verified email address. Grant the user:email scope, or verify an address on your GitHub account.'
          );
        }

        return {
          id: String(githubUser.id),
          email: primaryEmail,
          name: githubUser.name ?? undefined,
          avatarUrl: githubUser.avatar_url ?? undefined,
          username: githubUser.login ?? undefined,
        };
      }

      case 'google': {
        const googleUserResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const googleUser = parseProviderResponse(
          googleUserSchema,
          await googleUserResponse.json(),
          'Google'
        );

        // Same account-linking exposure as the GitHub branch, and now failing
        // closed the same way: a MISSING flag is not evidence of verification.
        // The v2 userinfo endpoint always sends `verified_email` for the
        // `email` scope, but the OIDC endpoint spells it `email_verified` -- so
        // an endpoint migration would silently start admitting unverified
        // addresses if this only rejected an explicit `false`.
        if (googleUser.verified_email !== true) {
          throw ApiError.badRequest('Google did not confirm the email address is verified');
        }

        return {
          id: googleUser.id,
          email: googleUser.email,
          name: googleUser.name ?? undefined,
          avatarUrl: googleUser.picture ?? undefined,
        };
      }

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
