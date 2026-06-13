import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Plus, Search, Eye, Pencil, Trash2, X, ChevronLeft, ChevronRight,
  AlertTriangle, Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { containerService, type ContainerFilters } from '@/services/containers';
import { zoneService } from '@/services/zones';
import { STATUS_CONFIG } from '@/utils/status';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import type { ContainerOut, ContainerStatus } from '@/types';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const containerSchema = z.object({
  qr_code: z.string().min(1, 'Requis'),
  address: z.string().optional(),
  zone_id: z.string().min(1, 'Zone requise'),
  lat: z.number({ error: 'Nombre requis' }).min(-90).max(90),
  lng: z.number({ error: 'Nombre requis' }).min(-180).max(180),
});

type ContainerFormData = z.infer<typeof containerSchema>;

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ContainerStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', cfg.color)}
      style={{ background: `${cfg.dot}18` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

// ─── Fill bar ─────────────────────────────────────────────────────────────────

function FillBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-gray-400">—</span>;
  const color = value >= 80 ? '#ef4444' : value >= 60 ? '#f59e0b' : '#22c55e';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-800">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs font-mono" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-white/5" style={{ width: `${60 + i * 8}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Container modal ──────────────────────────────────────────────────────────

function ContainerModal({
  editTarget,
  onClose,
}: {
  editTarget: ContainerOut | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: zones } = useQuery({ queryKey: ['zones'], queryFn: zoneService.list });
  const isEdit = editTarget !== null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContainerFormData>({
    resolver: zodResolver(containerSchema),
    defaultValues: editTarget
      ? {
          qr_code: editTarget.qr_code,
          address: editTarget.address ?? '',
          zone_id: editTarget.zone_id,
          lat: editTarget.lat,
          lng: editTarget.lng,
        }
      : undefined,
  });

  const save = useMutation({
    mutationFn: (data: ContainerFormData) =>
      isEdit
        ? containerService.update(editTarget!.id, data)
        : containerService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['containers'] });
      toast.success(isEdit ? 'Conteneur mis à jour' : 'Conteneur créé');
      onClose();
    },
    onError: () => toast.error('Une erreur est survenue'),
  });

  const onSubmit = (data: ContainerFormData) => save.mutate(data);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-bold text-white">
            {isEdit ? 'Modifier le conteneur' : 'Nouveau conteneur'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-400">QR Code</label>
            <input
              {...register('qr_code')}
              readOnly={isEdit}
              className={cn(
                'w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-emerald-500/50',
                isEdit && 'opacity-50 cursor-not-allowed'
              )}
            />
            {errors.qr_code && (
              <p className="mt-1 text-xs text-red-400">{errors.qr_code.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-400">Zone</label>
            <select
              {...register('zone_id')}
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-emerald-500/50"
            >
              <option value="">Sélectionner une zone</option>
              {zones?.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
            {errors.zone_id && (
              <p className="mt-1 text-xs text-red-400">{errors.zone_id.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-400">
              Adresse (optionnel)
            </label>
            <input
              {...register('address')}
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-400">Latitude</label>
              <input
                {...register('lat', { valueAsNumber: true })}
                type="number"
                step="any"
                className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
              {errors.lat && <p className="mt-1 text-xs text-red-400">{errors.lat.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-400">Longitude</label>
              <input
                {...register('lng', { valueAsNumber: true })}
                type="number"
                step="any"
                className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
              {errors.lng && <p className="mt-1 text-xs text-red-400">{errors.lng.message}</p>}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-gray-400 hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || save.isPending}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {save.isPending ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({
  container,
  onClose,
}: {
  container: ContainerOut;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: () => containerService.delete(container.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['containers'] });
      toast.success('Conteneur supprimé');
      onClose();
    },
    onError: () => toast.error('Suppression impossible'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-white/10 shadow-2xl p-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Supprimer le conteneur</h2>
            <p className="mt-1 text-xs text-gray-400">
              <span className="font-mono font-bold text-gray-300">{container.qr_code}</span>{' '}
              sera désactivé. Cette action est réversible depuis la BDD.
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-gray-400 hover:bg-white/5 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => del.mutate()}
            disabled={del.isPending}
            className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {del.isPending ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const STATUSES: ContainerStatus[] = ['NORMAL', 'WATCH', 'CRITICAL', 'MAINTENANCE', 'UNKNOWN'];
const PAGE_SIZE = 20;

export default function ContainersPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['ADMIN']);
  const isManager = hasRole(['MANAGER', 'ADMIN']);

  const [filters, setFilters] = useState<ContainerFilters>({ limit: PAGE_SIZE, offset: 0 });
  const [modal, setModal] = useState<'create' | ContainerOut | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContainerOut | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['containers', filters],
    queryFn: () => containerService.list(filters),
  });

  const { data: zones } = useQuery({ queryKey: ['zones'], queryFn: zoneService.list });

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);
  const currentPage = Math.floor((filters.offset ?? 0) / PAGE_SIZE) + 1;

  const setPage = (page: number) =>
    setFilters((f) => ({ ...f, offset: (page - 1) * PAGE_SIZE }));

  const update = (patch: Partial<ContainerFilters>) =>
    setFilters((f) => ({ ...f, ...patch, offset: 0 }));

  return (
    <div className="min-h-full bg-gray-950 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Conteneurs</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {data?.total ?? '…'} conteneur{(data?.total ?? 0) > 1 ? 's' : ''} au total
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => setModal('create')}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus size={15} />
            Ajouter
          </button>
        )}
      </div>

      {/* Filters bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher…"
            value={filters.search ?? ''}
            onChange={(e) => update({ search: e.target.value || undefined })}
            className="rounded-lg bg-white/5 border border-white/10 pl-8 pr-3 py-2 text-xs text-gray-300 placeholder-gray-600 outline-none focus:ring-1 focus:ring-emerald-500/50 w-44"
          />
        </div>

        <select
          value={filters.zone ?? ''}
          onChange={(e) => update({ zone: e.target.value || undefined })}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-gray-300 outline-none focus:ring-1 focus:ring-emerald-500/50"
        >
          <option value="">Toutes les zones</option>
          {zones?.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>

        <select
          value={filters.status ?? ''}
          onChange={(e) => update({ status: (e.target.value as ContainerStatus) || undefined })}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-gray-300 outline-none focus:ring-1 focus:ring-emerald-500/50"
        >
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_CONFIG[s].label}
            </option>
          ))}
        </select>

        {(filters.search || filters.zone || filters.status) && (
          <button
            onClick={() => setFilters({ limit: PAGE_SIZE, offset: 0 })}
            className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X size={12} /> Réinitialiser
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/3">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                QR Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Zone
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Remplissage
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Dernière mesure
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : !data || data.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <Package size={32} className="mx-auto mb-3 text-gray-700" />
                  <p className="text-sm text-gray-500">Aucun conteneur trouvé</p>
                  <p className="text-xs text-gray-700 mt-1">
                    Essayez de modifier vos filtres
                  </p>
                </td>
              </tr>
            ) : (
              data.items.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-white/5 hover:bg-white/2 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold text-gray-200">{c.qr_code}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{c.zone_name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <FillBar value={c.fill_level} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {c.last_measured_at
                      ? format(new Date(c.last_measured_at), 'dd MMM, HH:mm', { locale: fr })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/containers/${c.id}`)}
                        className="rounded-md p-1.5 text-gray-500 hover:bg-white/10 hover:text-gray-200 transition-colors"
                        title="Voir"
                      >
                        <Eye size={14} />
                      </button>
                      {isManager && (
                        <button
                          onClick={() => setModal(c)}
                          className="rounded-md p-1.5 text-gray-500 hover:bg-white/10 hover:text-emerald-400 transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="rounded-md p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>
            Page {currentPage} / {totalPages} · {data?.total} résultats
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-md p-1.5 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-md p-1.5 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {modal !== null && (
        <ContainerModal
          editTarget={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm container={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
