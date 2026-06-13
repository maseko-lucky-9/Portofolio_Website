/**
 * Authentication Service
 * 
 * Handles user authentication and token management
 */

import { httpClient } from '@/lib/http-client';
import type {
  User,
  LoginData,
  RegisterData,
  AuthResponse,
  RefreshTokenResponse,
  ApiResponse,
} from '@/types/api';

class AuthService {
  private readonly basePath = '/auth';

  /**
   * Login with email and password
   */
  async login(credentials: LoginData): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>(
      `${this.basePath}/login`,
      credentials,
      { skipAuth: true }
    );

    // Store tokens
    if (response.success && response.data) {
      httpClient.setTokens(
        response.data.accessToken,
        response.data.refreshToken
      );
    }

    return response;
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>(
      `${this.basePath}/register`,
      data,
      { skipAuth: true }
    );

    // Store tokens
    if (response.success && response.data) {
      httpClient.setTokens(
        response.data.accessToken,
        response.data.refreshToken
      );
    }

    return response;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await httpClient.post<ApiResponse<void>>(`${this.basePath}/logout`);
    } finally {
      httpClient.clearTokens();
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return httpClient.get<ApiResponse<User>>(`${this.basePath}/me`);
  }

  /**
   * Update current user profile
   */
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return httpClient.patch<ApiResponse<User>>(`${this.basePath}/me`, data);
  }

  /**
   * Change password
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<void>> {
    return httpClient.post<ApiResponse<void>>(`${this.basePath}/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    return httpClient.post<ApiResponse<void>>(
      `${this.basePath}/forgot-password`,
      { email },
      { skipAuth: true }
    );
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
    return httpClient.post<ApiResponse<void>>(
      `${this.basePath}/reset-password`,
      { token, newPassword },
      { skipAuth: true }
    );
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    return httpClient.post<RefreshTokenResponse>(
      `${this.basePath}/refresh`,
      undefined,
      { skipAuth: true }
    );
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!httpClient.getAccessToken();
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return httpClient.getAccessToken();
  }

  /**
   * Initiate OAuth login flow
   */
  loginWithOAuth(provider: 'github' | 'google'): void {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.location.href = `${apiUrl}/api/v1/auth/oauth/${provider}`;
  }

  /**
   * Get linked OAuth providers
   */
  async getOAuthProviders(): Promise<
    ApiResponse<{ providers: Array<{ provider: string; email: string | null; linkedAt: Date }> }>
  > {
    return httpClient.get<
      ApiResponse<{ providers: Array<{ provider: string; email: string | null; linkedAt: Date }> }>
    >(`${this.basePath}/oauth/providers`);
  }

  /**
   * Unlink OAuth provider from account
   */
  async unlinkOAuthProvider(provider: 'github' | 'google'): Promise<ApiResponse<void>> {
    return httpClient.delete<ApiResponse<void>>(`${this.basePath}/oauth/unlink/${provider}`);
  }
}

export const authService = new AuthService();
export default authService;
