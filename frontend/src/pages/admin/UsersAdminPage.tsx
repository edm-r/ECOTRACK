import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Plus, Pencil, UserX, X, ChevronLeft, ChevronRight, Search, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services/admin';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/utils/cn';
import type { UserOut, UserRole, UserStatus } from '@/types';

// ─── Role & status config ─────────────────────────────────────────────────────

const ROLE_BADGE: Record<UserRole, { label: string; color: string; bg: string }> = {
  CITIZEN: { label: 'Citoyen',   color: 'text-gray-300',  bg: 'bg-gray-700' },
  AGENT:   { label: 'Agent',     color: 'text-blue-300',  bg: 'bg-blue-500/15' },
  MANAGER: { label: 'Manager',   color: 'text-teal-300',  bg: 'bg-teal-500/15' },
  ADMIN:   { label: 'Admin',     color: 'text-purple-300',bg: 'bg-purple-500/15' },
};

const STATUS_BADGE: Record<UserStatus, { label: string; color: string; dot: string }> = {
  ACTIVE:   { label: 'Actif',    color: 'text-green-400', dot: '#4ade80' },
  INACTIVE: { label: 'Inactif',  color: 'text-red-400',   dot: '#f87171' },
};

const ROLES: UserRole[] = ['CITIZEN', 'AGENT', 'MANAGER', 'ADMIN'];
const PAGE_SIZE = 25;

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  email:     z.string({ error: 'Requis' }).email('Email invalide'),
  password:  z.string({ error: 'Requis' }).min(8, '8 caractères minimum'),
  full_name: z.string({ error: 'Requis' }).min(2, '2 caractères minimum'),
  role:      z.enum(['CITIZEN', 'AGENT', 'MANAGER', 'ADMIN']),
});

const editSchema = z.object({
  full_name: z.string({ error: 'Requis' }).min(2, '2 caractères minimum'),
  role:      z.enum(['CITIZEN', 'AGENT', 'MANAGER', 'ADMIN']),
  status:    z.enum(['ACTIVE', 'INACTIVE']),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm   = z.infer<typeof editSchema>;

// ─── Create modal ─────────────────────────────────────────────────────────────

function CreateModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'CITIZEN' },
  });

  const create = useMutation({
    mutationFn: adminService.createUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Utilisateur créé'); onClose(); },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === 'string' && detail.includes('409') ? 'Email déjà utilisé' : 'Création impossible');
    },
  });

  const field = 'rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-200 w-full outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 placeholder-gray-600';
  const err = 'mt-1 text-[10px] text-red-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-bold text-white">Créer un utilisateur</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => create.mutate(d))} className="p-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-400">Email</label>
            <input {...register('email')} placeholder="user@exemple.com" className={field} />
            {errors.email && <p className={err}>{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-400">Mot de passe</label>
            <input {...register('password')} type="password" placeholder="8 caractères minimum" className={field} />
            {errors.password && <p className={err}>{errors.password.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-400">Nom complet</label>
            <input {...register('full_name')} placeholder="Prénom Nom" className={field} />
            {errors.full_name && <p className={err}>{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-400">Rôle</label>
            <select {...register('role')} className={field}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_BADGE[r].label}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-gray-400 hover:bg-white/5 transition-colors">Annuler</button>
            <button type="submit" disabled={create.isPending} className="flex-1 rounded-lg bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors">
              {create.isPending ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit modal ───────────────────────────────────────────────────────────────

function EditModal({ user, onClose }: { user: UserOut; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { full_name: user.full_name, role: user.role, status: user.status },
  });

  const update = useMutation({
    mutationFn: (d: EditForm) => adminService.updateUser(user.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Utilisateur mis à jour'); onClose(); },
    onError: () => toast.error('Mise à jour impossible'),
  });

  const field = 'rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-200 w-full outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20';
  const errCls = 'mt-1 text-[10px] text-red-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-white">Modifier l'utilisateur</h2>
            <p className="text-[10px] text-gray-500">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => update.mutate(d))} className="p-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-400">Nom complet</label>
            <input {...register('full_name')} className={field} />
            {errors.full_name && <p className={errCls}>{errors.full_name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-400">Rôle</label>
              <select {...register('role')} className={field}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_BADGE[r].label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-400">Statut</label>
              <select {...register('status')} className={field}>
                <option value="ACTIVE">Actif</option>
                <option value="INACTIVE">Inactif</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-gray-400 hover:bg-white/5 transition-colors">Annuler</button>
            <button type="submit" disabled={update.isPending} className="flex-1 rounded-lg bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors">
              {update.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Deactivate confirm ───────────────────────────────────────────────────────

function DeactivateConfirm({ user, currentUserId, onClose }: { user: UserOut; currentUserId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const isSelf = user.id === currentUserId;

  const deactivate = useMutation({
    mutationFn: () => adminService.deleteUser(user.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Utilisateur désactivé'); onClose(); },
    onError: (err: any) => {
      const status = err?.response?.status;
      toast.error(status === 409 ? 'Impossible de se désactiver soi-même' : 'Désactivation impossible');
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-white/10 shadow-2xl p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <UserX size={20} className="text-red-400" />
        </div>
        <h2 className="font-bold text-white">Désactiver cet utilisateur ?</h2>
        <p className="mt-1 text-xs text-gray-400">{user.full_name} ({user.email})</p>
        {isSelf && <p className="mt-2 text-xs text-red-400">Vous ne pouvez pas vous désactiver vous-même.</p>}
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-gray-400 hover:bg-white/5 transition-colors">Annuler</button>
          <button
            onClick={() => deactivate.mutate()}
            disabled={deactivate.isPending || isSelf}
            className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
          >
            {deactivate.isPending ? 'Désactivation…' : 'Désactiver'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UsersAdminPage() {
  const { user: currentUser } = useAuthStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<UserOut | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<UserOut | null>(null);

  const params = {
    limit: PAGE_SIZE,
    offset,
    ...(search ? { search } : {}),
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => adminService.listUsers(params),
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const resetPage = () => setOffset(0);

  return (
    <div className="min-h-full bg-gray-950 p-4 lg:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white">Utilisateurs</h1>
          <p className="mt-0.5 text-xs text-gray-600">{total} compte{total > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          <Plus size={15} /> Créer
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            placeholder="Recherche email / nom…"
            className="w-full rounded-lg bg-white/5 border border-white/10 pl-8 pr-3 py-2 text-xs text-gray-300 outline-none focus:border-teal-500/50"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); resetPage(); }}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-gray-300 outline-none"
        >
          <option value="">Tous les rôles</option>
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_BADGE[r].label}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-gray-300 outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Actif</option>
          <option value="INACTIVE">Inactif</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {['Nom', 'Email', 'Rôle', 'Statut', 'Créé le', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-white/5" style={{ width: `${[70, 80, 50, 50, 60, 40][j]}%` }} /></td>
                  ))}
                </tr>
              ))
            ) : !data || data.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <Users size={28} className="mx-auto mb-2 text-gray-700" />
                  <p className="text-sm text-gray-500">Aucun utilisateur</p>
                </td>
              </tr>
            ) : (
              data.items.map((u) => {
                const role = ROLE_BADGE[u.role];
                const status = STATUS_BADGE[u.status];
                return (
                  <tr key={u.id} className={cn('border-b border-white/5 transition-colors hover:bg-white/2', u.status === 'INACTIVE' && 'opacity-50')}>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-200">{u.full_name}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', role.bg, role.color)}>
                        {role.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('flex items-center gap-1 text-[11px] font-semibold', status.color)}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.dot }} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 tabular-nums">
                      {format(new Date(u.created_at), 'dd/MM/yyyy', { locale: fr })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditTarget(u)}
                          className="rounded-md p-1.5 text-gray-500 hover:bg-white/10 hover:text-teal-400 transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={13} />
                        </button>
                        {u.status === 'ACTIVE' && (
                          <button
                            onClick={() => setDeactivateTarget(u)}
                            className="rounded-md p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                            title="Désactiver"
                          >
                            <UserX size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>Page {currentPage} / {totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={currentPage === 1} className="rounded-md p-1.5 hover:bg-white/10 disabled:opacity-30 transition-colors"><ChevronLeft size={14} /></button>
            <button onClick={() => setOffset(offset + PAGE_SIZE)} disabled={currentPage === totalPages} className="rounded-md p-1.5 hover:bg-white/10 disabled:opacity-30 transition-colors"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
      {editTarget && <EditModal user={editTarget} onClose={() => setEditTarget(null)} />}
      {deactivateTarget && currentUser && (
        <DeactivateConfirm
          user={deactivateTarget}
          currentUserId={currentUser.id}
          onClose={() => setDeactivateTarget(null)}
        />
      )}
    </div>
  );
}
