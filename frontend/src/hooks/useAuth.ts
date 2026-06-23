import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { authService } from '@/services/auth';
import type { UserRole } from '@/types';

export function useAuth() {
  const { token, user, setSession, logout: storeLogout } = useAuthStore();

  const isAuthenticated = Boolean(token && user);

  const hasRole = useCallback(
    (roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authService.login(email, password);
      setSession(response.access_token, response.refresh_token, response.user);
      return response;
    },
    [setSession]
  );

  const logout = useCallback(() => {
    storeLogout();
  }, [storeLogout]);

  return { user, token, isAuthenticated, hasRole, login, logout };
}
