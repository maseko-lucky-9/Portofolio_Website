import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, type User, type LoginCredentials } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithOAuth: (provider: 'github' | 'google') => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to load user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!user) return;

    // Refresh token 5 minutes before expiry (access token is 15 minutes)
    const refreshInterval = setInterval(
      async () => {
        try {
          await authApi.refreshToken();
        } catch (error) {
          console.error('Failed to refresh token:', error);
          // If refresh fails, log out the user
          await logout();
        }
      },
      10 * 60 * 1000 // 10 minutes
    );

    return () => clearInterval(refreshInterval);
  }, [user]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const userData = await authApi.login(credentials);
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithOAuth = useCallback((provider: 'github' | 'google') => {
    // Redirect to OAuth endpoint
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.location.href = `${apiUrl}/api/v1/auth/oauth/${provider}`;
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    await authApi.refreshToken();
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    const updatedUser = await authApi.updateProfile(data);
    setUser(updatedUser);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithOAuth,
    logout,
    refreshToken,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
