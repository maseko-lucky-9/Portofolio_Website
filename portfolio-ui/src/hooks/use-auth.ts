/**
 * Authentication Hooks
 * 
 * React Query hooks for authentication operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { queryKeys } from '@/lib/react-query';
import type { LoginData, RegisterData, User } from '@/types/api';

/**
 * Get current user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: () => authService.getCurrentUser(),
    enabled: authService.isAuthenticated(),
    staleTime: Infinity, // User data rarely changes
    retry: false,
  });
}

/**
 * Login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (credentials: LoginData) => authService.login(credentials),
    onSuccess: (response) => {
      toast.success('Login successful!');
      queryClient.setQueryData(queryKeys.auth.user(), {
        success: true,
        data: response.data.user,
      });
      navigate('/dashboard');
    },
  });
}

/**
 * Register mutation
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (response) => {
      toast.success('Registration successful!');
      queryClient.setQueryData(queryKeys.auth.user(), {
        success: true,
        data: response.data.user,
      });
      navigate('/dashboard');
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      toast.success('Logged out successfully');
      queryClient.clear();
      navigate('/');
    },
  });
}

/**
 * Update profile mutation
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<User>) => authService.updateProfile(data),
    onSuccess: (response) => {
      toast.success('Profile updated successfully');
      queryClient.setQueryData(queryKeys.auth.user(), response);
    },
  });
}

/**
 * Change password mutation
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: ({ 
      currentPassword, 
      newPassword 
    }: { 
      currentPassword: string; 
      newPassword: string;
    }) => authService.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
  });
}

/**
 * Request password reset
 */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => authService.requestPasswordReset(email),
    onSuccess: () => {
      toast.success('Password reset link sent to your email');
    },
  });
}

/**
 * Reset password with token
 */
export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authService.resetPassword(token, newPassword),
    onSuccess: () => {
      toast.success('Password reset successful. You can now login.');
      navigate('/login');
    },
  });
}

/**
 * Check if user is authenticated
 */
export function useIsAuthenticated() {
  const { data, isLoading } = useCurrentUser();
  return {
    isAuthenticated: !!data?.data,
    user: data?.data,
    isLoading,
  };
}
