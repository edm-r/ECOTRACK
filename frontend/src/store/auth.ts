import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserOut } from '@/types';

interface AuthState {
  token: string | null;
  user: UserOut | null;
  isHydrated: boolean;
  setSession: (token: string, user: UserOut) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isHydrated: false,
      setSession: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'ecotrack-auth',
      // Ne persiste que les données — pas les actions ni isHydrated
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (_state, error) => {
        if (!error) {
          useAuthStore.setState({ isHydrated: true });
        }
      },
    }
  )
);
