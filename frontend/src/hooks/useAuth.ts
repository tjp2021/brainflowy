import { useEffect } from 'react';
import { mockAuthService } from '@/services/api/mockAuth';
import { useAppStore } from '@/store/useAppStore';
import type { User } from '@/types';

export const useAuth = () => {
  const user = useAppStore(state => state.user);
  const setUser = useAppStore(state => state.setUser);
  const setLoading = useAppStore(state => state.setLoading);
  const setError = useAppStore(state => state.setError);

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        const currentUser = await mockAuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!user) {
      initAuth();
    }
  }, [user, setUser, setLoading]);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await mockAuthService.login(email, password);
      setUser(response.user);
      
      return response.user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string): Promise<User> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await mockAuthService.register(email, password, displayName);
      setUser(response.user);
      
      return response.user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await mockAuthService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, clear local state
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
};
