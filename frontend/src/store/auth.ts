import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserOut } from '@/types';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: UserOut | null;
  setSession: (token: string, refreshToken: string, user: UserOut) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      setSession: (token, refreshToken, user) => set({ token, refreshToken, user }),
      logout: () => set({ token: null, refreshToken: null, user: null }),
    }),
    {
      name: 'ecotrack-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
