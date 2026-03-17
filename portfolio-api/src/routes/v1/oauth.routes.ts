import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { oauthService, OAuthProvider } from '../../services/oauth.service.js';
import { ApiError } from '../../utils/errors.js';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { config } from '../../config/index.js';
import crypto from 'crypto';

// State store for OAuth CSRF protection (in production, use Redis)
const oauthStates = new Map<string, { provider: OAuthProvider; createdAt: number }>();

// Clean up old states every 5 minutes
setInterval(() => {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  for (const [state, data] of oauthStates.entries()) {
    if (now - data.createdAt > fiveMinutes) {
      oauthStates.delete(state);
    }
  }
}, 5 * 60 * 1000);

export default async function oauthRoutes(fastify: FastifyInstance) {
  /**
   * Initiate OAuth flow
   * GET /auth/oauth/:provider
   */
  fastify.get<{
    Params: { provider: string };
  }>('/oauth/:provider', async (request, reply) => {
    const { provider } = request.params;

    // Validate provider
    if (provider !== 'github' && provider !== 'google') {
      throw ApiError.badRequest('Unsupported OAuth provider');
    }

    // Check if provider is configured
    const providerConfig = config.oauth[provider];
    if (!providerConfig.clientId || !providerConfig.clientSecret) {
      throw ApiError.badRequest(`${provider} OAuth is not configured`);
    }

    // Generate random state for CSRF protection
    const state = crypto
      .createHmac('sha256', config.oauth.stateSecret)
      .update(crypto.randomBytes(32))
      .digest('hex');

    // Store state with expiration
    oauthStates.set(state, {
      provider,
      createdAt: Date.now(),
    });

    // Get authorization URL
    const authUrl = oauthService.getAuthorizationUrl(provider, state);

    // Redirect to OAuth provider
    reply.redirect(authUrl);
  });

  /**
   * OAuth callback
   * GET /auth/oauth/:provider/callback
   */
  fastify.get<{
    Params: { provider: string };
    Querystring: { code?: string; state?: string; error?: string; error_description?: string };
  }>('/oauth/:provider/callback', async (request, reply) => {
    const { provider } = request.params;
    const { code, state, error, error_description } = request.query;

    // Check for OAuth errors
    if (error) {
      const frontendUrl = config.cors.origin;
      return reply.redirect(
        `${frontendUrl}/auth/error?error=${encodeURIComponent(error_description || error)}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      throw ApiError.badRequest('Missing OAuth callback parameters');
    }

    // Validate provider
    if (provider !== 'github' && provider !== 'google') {
      throw ApiError.badRequest('Unsupported OAuth provider');
    }

    // Verify state (CSRF protection)
    const storedState = oauthStates.get(state);
    if (!storedState || storedState.provider !== provider) {
      throw ApiError.badRequest('Invalid OAuth state');
    }

    // Delete used state
    oauthStates.delete(state);

    try {
      // Exchange code for access token
      const { accessToken, refreshToken } = await oauthService.exchangeCodeForToken(
        provider,
        code
      );

      // Get user profile from OAuth provider
      const profile = await oauthService.getOAuthProfile(provider, accessToken);

      // Handle OAuth callback (create or link account)
      const result = await oauthService.handleOAuthCallback(
        provider,
        profile,
        accessToken,
        refreshToken
      );

      // Set cookies
      reply.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60, // 15 minutes
      });

      reply.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      // Redirect to frontend
      const frontendUrl = config.cors.origin;
      const redirectPath = result.isNewUser ? '/welcome' : '/dashboard';
      
      reply.redirect(`${frontendUrl}${redirectPath}`);
    } catch (error) {
      fastify.log.error({ err: error }, 'OAuth callback error');
      const frontendUrl = config.cors.origin;
      return reply.redirect(
        `${frontendUrl}/auth/error?error=${encodeURIComponent('OAuth authentication failed')}`
      );
    }
  });

  /**
   * Link OAuth provider to existing account
   * POST /auth/oauth/link
   */
  fastify.post<{
    Body: { provider: OAuthProvider; code: string; state: string };
  }>(
    '/oauth/link',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { provider, code, state } = request.body as {
        provider: OAuthProvider;
        code: string;
        state: string;
      };
      const user = (request as unknown as AuthenticatedRequest).user;

      // Verify state
      const storedState = oauthStates.get(state);
      if (!storedState || storedState.provider !== provider) {
        throw ApiError.badRequest('Invalid OAuth state');
      }

      // Delete used state
      oauthStates.delete(state);

      // Exchange code for access token
      const { accessToken, refreshToken } = await oauthService.exchangeCodeForToken(
        provider,
        code
      );

      // Get user profile from OAuth provider
      const profile = await oauthService.getOAuthProfile(provider, accessToken);

      // Link OAuth provider to authenticated user
      await oauthService.linkOAuthProvider(
        user.id,
        provider,
        profile,
        accessToken,
        refreshToken
      );

      reply.send({
        success: true,
        message: `${provider} account linked successfully`,
      });
    }
  );

  /**
   * Unlink OAuth provider
   * DELETE /auth/oauth/unlink/:provider
   */
  fastify.delete<{
    Params: { provider: string };
  }>(
    '/oauth/unlink/:provider',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { provider } = request.params as { provider: string };
      const user = (request as unknown as AuthenticatedRequest).user;

      // Validate provider
      if (provider !== 'github' && provider !== 'google') {
        throw ApiError.badRequest('Unsupported OAuth provider');
      }

      await oauthService.unlinkOAuthProvider(user.id, provider as OAuthProvider);

      reply.send({
        success: true,
        message: `${provider} account unlinked successfully`,
      });
    }
  );

  /**
   * Get linked OAuth providers
   * GET /auth/oauth/providers
   */
  fastify.get(
    '/oauth/providers',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as unknown as AuthenticatedRequest).user;

      const providers = await oauthService.getUserOAuthProviders(user.id);

      reply.send({
        providers,
      });
    }
  );
}
