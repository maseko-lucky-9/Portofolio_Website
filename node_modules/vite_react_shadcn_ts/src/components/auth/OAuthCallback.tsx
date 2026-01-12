import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshToken } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      // Check for error
      const error = searchParams.get('error');
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Authentication Failed',
          description: decodeURIComponent(error),
        });
        navigate('/login');
        return;
      }

      // OAuth callback sets cookies, so we just need to refresh our state
      try {
        // Get the latest user data
        await refreshToken();

        toast({
          title: 'Login Successful',
          description: 'You have been logged in successfully.',
        });

        // Redirect to dashboard or intended page
        const from = sessionStorage.getItem('oauth_redirect') || '/dashboard';
        sessionStorage.removeItem('oauth_redirect');
        navigate(from);
      } catch (err) {
        console.error('Failed to complete OAuth login:', err);
        toast({
          variant: 'destructive',
          title: 'Authentication Failed',
          description: 'Failed to complete login. Please try again.',
        });
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate, refreshToken, searchParams, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing login...</p>
      </div>
    </div>
  );
}
