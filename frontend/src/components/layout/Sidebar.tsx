import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Trash2,
  Route,
  BarChart3,
  Map,
  UserCircle,
  Truck,
  Users,
  ScrollText,
  Leaf,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard size={17} />,
    roles: ['MANAGER', 'ADMIN'],
  },
  {
    label: 'Conteneurs',
    path: '/containers',
    icon: <Trash2 size={17} />,
    roles: ['MANAGER', 'ADMIN'],
  },
  {
    label: 'Tournées',
    path: '/tours',
    icon: <Route size={17} />,
    roles: ['MANAGER', 'ADMIN'],
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: <BarChart3 size={17} />,
    roles: ['MANAGER', 'ADMIN'],
  },
  {
    label: 'Utilisateurs',
    path: '/admin/users',
    icon: <Users size={17} />,
    roles: ['ADMIN'],
  },
  {
    label: 'Audit logs',
    path: '/admin/audit',
    icon: <ScrollText size={17} />,
    roles: ['ADMIN'],
  },
  { label: 'Carte', path: '/map', icon: <Map size={17} />, roles: ['CITIZEN'] },
  {
    label: 'Mon profil',
    path: '/profile',
    icon: <UserCircle size={17} />,
    roles: ['CITIZEN'],
  },
  {
    label: 'Mes tournées',
    path: '/my-tours',
    icon: <Truck size={17} />,
    roles: ['AGENT'],
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="flex h-full w-60 flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
            <Leaf size={15} className="text-white" />
          </div>
          <span className="text-[17px] font-bold tracking-tight text-white">
            ECO<span className="text-emerald-400">TRACK</span>
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Fermer le menu"
            className="rounded-md p-1 text-slate-500 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="mx-4 h-px bg-slate-800" />

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Pied — identité utilisateur */}
      {user && (
        <>
          <div className="mx-4 h-px bg-slate-800" />
          <div className="px-5 py-4">
            <p className="truncate text-xs font-semibold text-slate-200">{user.full_name}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>
          </div>
        </>
      )}
    </div>
  );
}
