import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldOff, Home, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  allow: UserRole[];
  children: React.ReactNode;
}

// Page d'accueil par défaut selon le rôle (cible du bouton « Retour à l'accueil »).
const ROLE_HOME: Record<UserRole, string> = {
  CITIZEN: '/map',
  AGENT: '/my-tours',
  MANAGER: '/dashboard',
  ADMIN: '/dashboard',
};

export function ProtectedRoute({ allow, children }: ProtectedRouteProps) {
  const { token, user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  if (!token || !user) {
    // UX-01 — conserver la cible pour y revenir après connexion.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allow.includes(user.role)) {
    // UX-21 — garder une navigation claire au lieu de bloquer l'utilisateur.
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <ShieldOff size={28} className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Accès refusé</h1>
        <p className="max-w-sm text-center text-sm text-gray-500">
          Votre rôle <span className="font-medium text-gray-700">({user.role})</span> ne permet pas
          d'accéder à cette page.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => navigate(ROLE_HOME[user.role] ?? '/', { replace: true })}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Home size={15} />
            Retour à l'accueil
          </button>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <LogOut size={15} />
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
