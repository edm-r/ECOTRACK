import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { reportService } from '@/services/reports';
import { cn } from '@/utils/cn';
import type { ReportStatus, ReportOut } from '@/types';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; dot: string }> = {
  OPEN: { label: 'Ouvert', color: 'text-blue-400', dot: '#60a5fa' },
  CONFIRMED: { label: 'Confirmé', color: 'text-amber-500', dot: '#f59e0b' },
  RESOLVED: { label: 'Résolu', color: 'text-green-500', dot: '#22c55e' },
  REJECTED: { label: 'Rejeté', color: 'text-gray-500', dot: '#6b7280' },
};

const TYPE_LABELS: Record<string, string> = {
  FULL: 'Plein',
  DAMAGED: 'Endommagé',
  BLOCKED: 'Inaccessible',
  OTHER: 'Autre',
};

const ALL_STATUSES: Array<ReportStatus | 'ALL'> = ['ALL', 'OPEN', 'CONFIRMED', 'RESOLVED', 'REJECTED'];

const PAGE_SIZE = 20;

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReportStatus }) {
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      {[40, 80, 60, 70, 90, 60].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-white/5" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Status selector cell ─────────────────────────────────────────────────────

function StatusCell({ report }: { report: ReportOut }) {
  const qc = useQueryClient();

  const change = useMutation({
    mutationFn: (newStatus: string) => reportService.updateStatus(report.id, newStatus),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Statut mis à jour');
    },
    onError: () => toast.error('Impossible de mettre à jour'),
  });

  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={report.status} />
      <select
        value={report.status}
        disabled={change.isPending}
        onChange={(e) => change.mutate(e.target.value)}
        className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-xs text-gray-400 outline-none focus:ring-1 focus:ring-emerald-500/50 disabled:opacity-50"
      >
        {(['OPEN', 'CONFIRMED', 'RESOLVED', 'REJECTED'] as ReportStatus[]).map((s) => (
          <option key={s} value={s}>
            → {STATUS_CONFIG[s].label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [offset, setOffset] = useState(0);

  const params = {
    limit: PAGE_SIZE,
    offset,
    ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['reports', params],
    queryFn: () => reportService.listAll(params),
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const handleTabChange = (s: ReportStatus | 'ALL') => {
    setStatusFilter(s);
    setOffset(0);
  };

  return (
    <div className="min-h-full bg-gray-950 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Signalements</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {total} signalement{total > 1 ? 's' : ''} au total
        </p>
      </div>

      {/* Status tabs */}
      <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-gray-900/50 border border-white/5 p-1 w-fit">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => handleTabChange(s)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
              statusFilter === s
                ? 'bg-emerald-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-300'
            )}
          >
            {s === 'ALL' ? 'Tous' : STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {['ID', 'Conteneur', 'Type', 'Statut', 'Date', 'Changer statut'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                  {h}
                </th>
              ))}
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
                  <FileText size={28} className="mx-auto mb-2 text-gray-700" />
                  <p className="text-sm text-gray-500">Aucun signalement</p>
                </td>
              </tr>
            ) : (
              data.items.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-white/5 hover:bg-white/2 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-500">#{r.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-400">{r.container_id.slice(0, 8)}…</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-300">
                    {TYPE_LABELS[r.type] ?? r.type}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {format(new Date(r.created_at), 'dd MMM yyyy', { locale: fr })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusCell report={r} />
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
    </div>
  );
}
