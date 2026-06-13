import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import MapPage from '@/pages/map/MapPage';
import ContainersPage from '@/pages/containers/ContainersPage';
import ContainerDetailPage from '@/pages/containers/ContainerDetailPage';

// ─── Placeholder pour les pages à venir ──────────────────────────────────────

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center p-8">
      <div className="max-w-sm rounded-2xl border border-dashed border-gray-300 bg-white px-12 py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">
          En construction
        </p>
        <h1 className="mt-2 text-xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-400">
          Cette section sera disponible dans une prochaine phase.
        </p>
      </div>
    </div>
  );
}

// ─── Redirection racine selon rôle ────────────────────────────────────────────

const ROLE_REDIRECT: Record<string, string> = {
  CITIZEN: '/map',
  AGENT: '/my-tours',
  MANAGER: '/dashboard',
  ADMIN: '/dashboard',
};

function RootRedirect() {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_REDIRECT[user.role] ?? '/dashboard'} replace />;
}

// ─── Page 404 ─────────────────────────────────────────────────────────────────

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <span className="text-8xl font-black text-emerald-600">404</span>
      <h1 className="text-xl font-bold text-gray-900">Page introuvable</h1>
      <p className="text-sm text-gray-500">La page que vous cherchez n'existe pas.</p>
      <a
        href="/"
        className="mt-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Retour à l'accueil
      </a>
    </div>
  );
}

// ─── Helper pour éviter la répétition ────────────────────────────────────────

type Role = 'CITIZEN' | 'AGENT' | 'MANAGER' | 'ADMIN';

function Protected({
  allow,
  title,
  children,
}: {
  allow: Role[];
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <ProtectedRoute allow={allow}>
      <AppShell>{children ?? <PlaceholderPage title={title ?? ''} />}</AppShell>
    </ProtectedRoute>
  );
}

// ─── Router principal ─────────────────────────────────────────────────────────

export function AppRouter() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Racine → redirection selon rôle */}
      <Route path="/" element={<RootRedirect />} />

      {/* MANAGER + ADMIN */}
      <Route path="/dashboard" element={<Protected allow={['MANAGER', 'ADMIN']} title="Dashboard" />} />
      <Route
        path="/containers"
        element={
          <ProtectedRoute allow={['MANAGER', 'ADMIN']}>
            <AppShell>
              <ContainersPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/containers/:id"
        element={
          <ProtectedRoute allow={['MANAGER', 'ADMIN', 'AGENT']}>
            <AppShell>
              <ContainerDetailPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route path="/tours" element={<Protected allow={['MANAGER', 'ADMIN']} title="Tournées" />} />
      <Route path="/tours/new" element={<Protected allow={['MANAGER', 'ADMIN']} title="Créer une tournée" />} />
      <Route path="/tours/:id" element={<Protected allow={['MANAGER', 'ADMIN', 'AGENT']} title="Détail tournée" />} />
      <Route path="/analytics" element={<Protected allow={['MANAGER', 'ADMIN']} title="Analytics" />} />

      {/* ADMIN */}
      <Route path="/admin/users" element={<Protected allow={['ADMIN']} title="Gestion utilisateurs" />} />
      <Route path="/admin/audit" element={<Protected allow={['ADMIN']} title="Audit logs" />} />

      {/* AGENT */}
      <Route path="/my-tours" element={<Protected allow={['AGENT']} title="Mes tournées" />} />

      {/* CITIZEN + tous les rôles pour la carte */}
      <Route
        path="/map"
        element={
          <ProtectedRoute allow={['CITIZEN', 'AGENT', 'MANAGER', 'ADMIN']}>
            <AppShell>
              <MapPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route path="/reports/new" element={<Protected allow={['CITIZEN']} title="Signaler un problème" />} />
      <Route path="/profile" element={<Protected allow={['CITIZEN']} title="Mon profil" />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
