import { useState } from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from './Sidebar';
import { AlertsBell } from '@/components/alerts/AlertsPanel';

const ROLE_CONFIG = {
  CITIZEN: { label: 'Citoyen', className: 'bg-blue-100 text-blue-700' },
  AGENT: { label: 'Agent', className: 'bg-amber-100 text-amber-700' },
  MANAGER: { label: 'Gestionnaire', className: 'bg-emerald-100 text-emerald-700' },
  ADMIN: { label: 'Administrateur', className: 'bg-red-100 text-red-700' },
} as const;

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout, hasRole } = useAuth();

  const roleConfig = user ? ROLE_CONFIG[user.role] : null;
  const isManager = hasRole(['MANAGER', 'ADMIN']);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Sidebar desktop ──────────────────────────────── */}
      <aside className="hidden shrink-0 lg:flex">
        <Sidebar />
      </aside>

      {/* ── Sidebar mobile (drawer) ───────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Panel */}
          <div className="relative z-50 h-full">
            <Sidebar onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Zone principale ───────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Ouvrir le menu"
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <Menu size={20} />
          </button>

          {/* Right section */}
          <div className="ml-auto flex items-center gap-2">
            {/* UX-22 — la cloche d'alertes n'est utile qu'aux gestionnaires/admins. */}
            {isManager && <AlertsBell />}

            {user && (
              <>
                {/* Badge rôle */}
                {roleConfig && (
                  <span
                    className={`hidden rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline-block ${roleConfig.className}`}
                  >
                    {roleConfig.label}
                  </span>
                )}

                {/* Nom */}
                <span className="hidden text-sm font-medium text-gray-700 md:block">
                  {user.full_name}
                </span>

                {/* Déconnexion */}
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
                >
                  <LogOut size={15} />
                  <span className="hidden sm:inline">Déconnexion</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Contenu de la page */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
