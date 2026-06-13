import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { authService } from '@/services/auth';
import { AppRouter } from '@/router';

function AppBootstrap() {
  const { token, isHydrated, logout } = useAuthStore();

  // Revalide le token persisté au démarrage (une seule fois après hydration)
  useEffect(() => {
    if (!isHydrated || !token) return;

    authService.getMe().catch(() => {
      // Token invalide ou expiré → l'intercepteur axios gère le redirect vers /login
      logout();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  // Spinner pendant la réhydratation du store (évite un flash de redirection)
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
