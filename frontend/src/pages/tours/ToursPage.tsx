import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Plus, Eye, UserCheck, ChevronLeft, ChevronRight,
  Route, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { routeService } from '@/services/routes';
import { zoneService } from '@/services/zones';
import { cn } from '@/utils/cn';
import type { RouteOut, RouteStatus } from '@/types';

// ─── Status config ────────────────────────────────────────────────────────────

const ROUTE_STATUS: Record<RouteStatus, { label: string; color: string; dot: string; pulse?: boolean }> = {
  DRAFT:       { label: 'Brouillon',   color: 'text-gray-400',  dot: '#6b7280' },
  ASSIGNED:    { label: 'Assignée',    color: 'text-blue-400',  dot: '#60a5fa' },
  IN_PROGRESS: { label: 'En cours',    color: 'text-amber-400', dot: '#fbbf24', pulse: true },
  DONE:        { label: 'Terminée',    color: 'text-green-400', dot: '#4ade80' },
  CANCELLED:   { label: 'Annulée',     color: 'text-red-400',   dot: '#f87171' },
};

const ALL_STATUSES: Array<RouteStatus | 'ALL'> = ['ALL', 'DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

// ─── Status badge ─────────────────────────────────────────────────────────────

function RouteBadge({ status }: { status: RouteStatus }) {
  const cfg = ROUTE_STATUS[status];
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', cfg.color)}
      style={{ background: `${cfg.dot}18` }}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', cfg.pulse && 'animate-pulse')}
        style={{ background: cfg.dot }}
      />
      {cfg.label}
    </span>
  );
}

// ─── Assign modal ─────────────────────────────────────────────────────────────

function AssignModal({ route, onClose }: { route: RouteOut; onClose: () => void }) {
  const [agentId, setAgentId] = useState(route.agent_id ?? '');
  const qc = useQueryClient();

  const assign = useMutation({
    mutationFn: () => routeService.assign(route.id, agentId.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routes'] });
      toast.success('Agent assigné');
      onClose();
    },
    onError: () => toast.error('Assignation impossible'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-bold text-white">Assigner un agent</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-400">
              ID de l'agent <span className="text-gray-600">(UUID)</span>
            </label>
            <input
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 font-mono text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
            />
            <p className="mt-1 text-[10px] text-gray-600">
              La sélection par nom sera disponible en Phase 7.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-gray-400 hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => assign.mutate()}
              disabled={!agentId.trim() || assign.isPending}
              className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {assign.isPending ? 'Assignation…' : 'Assigner'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      {[60, 80, 70, 50, 60, 80, 70].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-white/5" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function ToursPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<RouteStatus | 'ALL'>('ALL');
  const [zoneFilter, setZoneFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [assignTarget, setAssignTarget] = useState<RouteOut | null>(null);

  const params = {
    limit: PAGE_SIZE,
    offset,
    ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
    ...(zoneFilter ? { zone: zoneFilter } : {}),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['routes', params],
    queryFn: () => routeService.list(params),
  });

  const { data: zones } = useQuery({ queryKey: ['zones'], queryFn: zoneService.list });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const changeTab = (s: RouteStatus | 'ALL') => { setStatusFilter(s); setOffset(0); };

  return (
    <div className="min-h-full bg-gray-950 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Tournées</h1>
          <p className="text-xs text-gray-500 mt-0.5">{total} tournée{total > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => navigate('/tours/new')}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          <Plus size={15} />
          Planifier
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1 rounded-xl bg-gray-900/50 border border-white/5 p-1">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => changeTab(s)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                statusFilter === s ? 'bg-teal-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {s === 'ALL' ? 'Toutes' : ROUTE_STATUS[s].label}
            </button>
          ))}
        </div>

        {/* Zone filter */}
        {zones && zones.length > 0 && (
          <select
            value={zoneFilter}
            onChange={(e) => { setZoneFilter(e.target.value); setOffset(0); }}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-gray-300 outline-none focus:ring-1 focus:ring-teal-500/50"
          >
            <option value="">Toutes les zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {['Date', 'Zone', 'Agent', 'Étapes', 'Distance', 'Statut', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
            ) : !data || data.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Route size={28} className="mx-auto mb-2 text-gray-700" />
                  <p className="text-sm text-gray-500">Aucune tournée</p>
                </td>
              </tr>
            ) : (
              data.items.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-300 font-mono">
                    {format(new Date(r.scheduled_date), 'dd/MM/yyyy', { locale: fr })}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{r.zone_name}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {r.agent_name ?? <span className="text-gray-700">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 tabular-nums">
                    {r.steps.length}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 tabular-nums">
                    {r.estimated_distance !== null
                      ? `${r.estimated_distance.toFixed(1)} km`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <RouteBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/tours/${r.id}`)}
                        className="rounded-md p-1.5 text-gray-500 hover:bg-white/10 hover:text-gray-200 transition-colors"
                        title="Voir"
                      >
                        <Eye size={14} />
                      </button>
                      {(r.status === 'DRAFT' || r.status === 'ASSIGNED') && (
                        <button
                          onClick={() => setAssignTarget(r)}
                          className="rounded-md p-1.5 text-gray-500 hover:bg-blue-500/10 hover:text-blue-400 transition-colors"
                          title="Assigner"
                        >
                          <UserCheck size={14} />
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
          <span>Page {currentPage} / {totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              disabled={currentPage === 1}
              className="rounded-md p-1.5 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={currentPage === totalPages}
              className="rounded-md p-1.5 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {assignTarget && (
        <AssignModal route={assignTarget} onClose={() => setAssignTarget(null)} />
      )}
    </div>
  );
}
