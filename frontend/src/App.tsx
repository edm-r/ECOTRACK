import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { authService } from '@/services/auth';
import { AppRouter } from '@/router';

function AppBootstrap() {
  const { token, logout } = useAuthStore();

  // localStorage est synchrone : hasHydrated() est vrai dès le premier render.
  // onFinishHydration couvre les cas de storage asynchrone (futur-proof).
  const [isHydrated, setIsHydrated] = useState(
    () => useAuthStore.persist.hasHydrated()
  );

  useEffect(() => {
    if (isHydrated) return;
    return useAuthStore.persist.onFinishHydration(() => setIsHydrated(true));
  }, [isHydrated]);

  // Revalide le token persisté au démarrage
  useEffect(() => {
    if (!isHydrated || !token) return;
    authService.getMe().catch(() => logout());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return <AppRouter />;
}

export default function App() {
  return <AppBootstrap />;
}
