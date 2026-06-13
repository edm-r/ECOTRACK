import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';

// ─── Lazy imports (code-splitting) ───────────────────────────────────────────
const Login           = lazy(() => import('@/pages/auth/Login'));
const Register        = lazy(() => import('@/pages/auth/Register'));
const MapPage         = lazy(() => import('@/pages/map/MapPage'));
const ContainersPage  = lazy(() => import('@/pages/containers/ContainersPage'));
const ContainerDetailPage = lazy(() => import('@/pages/containers/ContainerDetailPage'));
const NewReportPage   = lazy(() => import('@/pages/reports/NewReportPage'));
const ReportsPage     = lazy(() => import('@/pages/reports/ReportsPage'));
const ProfilePage     = lazy(() => import('@/pages/profile/ProfilePage'));
const ToursPage       = lazy(() => import('@/pages/tours/ToursPage'));
const NewTourPage     = lazy(() => import('@/pages/tours/NewTourPage'));
const TourDetailPage  = lazy(() => import('@/pages/tours/TourDetailPage'));
const MyToursPage     = lazy(() => import('@/pages/tours/MyToursPage'));
const DashboardPage   = lazy(() => import('@/pages/dashboard/DashboardPage'));
const AnalyticsPage   = lazy(() => import('@/pages/analytics/AnalyticsPage'));
const UsersAdminPage  = lazy(() => import('@/pages/admin/UsersAdminPage'));
const AuditLogsPage   = lazy(() => import('@/pages/admin/AuditLogsPage'));

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

// ─── Fallback de chargement ───────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
    </div>
  );
}

// ─── Router principal ─────────────────────────────────────────────────────────

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Racine → redirection selon rôle */}
        <Route path="/" element={<RootRedirect />} />

        {/* MANAGER + ADMIN */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allow={['MANAGER', 'ADMIN']}>
              <AppShell><DashboardPage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/containers"
          element={
            <ProtectedRoute allow={['MANAGER', 'ADMIN']}>
              <AppShell><ContainersPage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/containers/:id"
          element={
            <ProtectedRoute allow={['MANAGER', 'ADMIN', 'AGENT']}>
              <AppShell><ContainerDetailPage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tours"
          element={
            <ProtectedRoute allow={['MANAGER', 'ADMIN']}>
              <AppShell><ToursPage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tours/new"
          element={
            <ProtectedRoute allow={['MANAGER', 'ADMIN']}>
              <AppShell><NewTourPage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tours/:id"
          element={
            <ProtectedRoute allow={['MANAGER', 'ADMIN', 'AGENT']}>
              <AppShell><TourDetailPage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allow={['MANAGER', 'ADMIN']}>
              <AppShell><AnalyticsPage /></AppShell>
            </ProtectedRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allow={['ADMIN']}>
              <AppShell><UsersAdminPage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute allow={['ADMIN']}>
              <AppShell><AuditLogsPage /></AppShell>
            </ProtectedRoute>
          }
        />

        {/* AGENT */}
        <Route
          path="/my-tours"
          element={
            <ProtectedRoute allow={['AGENT']}>
              <AppShell><MyToursPage /></AppShell>
            </ProtectedRoute>
          }
        />

        {/* CITIZEN + tous les rôles pour la carte */}
        <Route
          path="/map"
          element={
            <ProtectedRoute allow={['CITIZEN', 'AGENT', 'MANAGER', 'ADMIN']}>
              <AppShell><MapPage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/new"
          element={
            <ProtectedRoute allow={['CITIZEN', 'AGENT']}>
              <AppShell><NewReportPage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allow={['MANAGER', 'ADMIN']}>
              <AppShell><ReportsPage /></AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allow={['CITIZEN']}>
              <AppShell><ProfilePage /></AppShell>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
