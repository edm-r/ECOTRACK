import { Navigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  allow: UserRole[];
  children: React.ReactNode;
}

export function ProtectedRoute({ allow, children }: ProtectedRouteProps) {
  const { token, user } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <ShieldOff size={28} className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Accès refusé</h1>
        <p className="text-sm text-gray-500">
          Votre rôle <span className="font-medium text-gray-700">({user.role})</span> ne permet pas
          d'accéder à cette page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
