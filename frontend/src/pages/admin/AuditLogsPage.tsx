import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, Search, Shield, Filter,
} from 'lucide-react';
import { adminService } from '@/services/admin';
import { cn } from '@/utils/cn';
import { QueryError } from '@/components/ui/QueryError';

// ─── Action badge color ───────────────────────────────────────────────────────

function actionColor(action: string): string {
  const a = action.toUpperCase();
  if (a.includes('DELETE') || a.includes('DEACTIVAT')) return 'text-red-400 bg-red-500/10';
  if (a.includes('CREATE') || a.includes('REGISTER')) return 'text-green-400 bg-green-500/10';
  if (a.includes('LOGIN'))                            return 'text-blue-400 bg-blue-500/10';
  if (a.includes('ALERT') || a.includes('ACKNOWLEDG')) return 'text-amber-400 bg-amber-500/10';
  return 'text-gray-400 bg-gray-500/10';
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      {[55, 70, 60, 50, 60, 40].map((w, i) => (
        <td key={i} className="px-4 py-3"><div className="h-3.5 animate-pulse rounded bg-white/5" style={{ width: `${w}%` }} /></td>
      ))}
    </tr>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export default function AuditLogsPage() {
  const [actionSearch, setActionSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [offset, setOffset] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const params = {
    limit: PAGE_SIZE,
    offset,
    ...(actionSearch ? { action: actionSearch } : {}),
    ...(fromDate ? { from: fromDate } : {}),
    ...(toDate ? { to: toDate } : {}),
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => adminService.listAuditLogs(params),
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const resetPage = () => setOffset(0);

  const hasFilters = actionSearch || fromDate || toDate;

  return (
    <div className="min-h-full bg-gray-950 p-4 lg:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white">Audit logs</h1>
          <p className="mt-0.5 text-xs text-gray-600">{total.toLocaleString('fr-FR')} événement{total > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
            showFilters || hasFilters
              ? 'bg-teal-600/20 border border-teal-500/30 text-teal-400'
              : 'border border-white/10 text-gray-500 hover:text-gray-300'
          )}
        >
          <Filter size={13} />
          Filtres
          {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-4 rounded-xl border border-white/10 bg-gray-900 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Action</label>
              <div className="relative">
                <Search size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  value={actionSearch}
                  onChange={(e) => { setActionSearch(e.target.value); resetPage(); }}
                  placeholder="LOGIN, CREATE…"
                  className="w-full rounded-lg bg-white/5 border border-white/10 pl-7 pr-3 py-2 text-xs text-gray-300 outline-none focus:border-teal-500/40"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">À partir du</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); resetPage(); }}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-gray-300 outline-none focus:border-teal-500/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Jusqu'au</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); resetPage(); }}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-gray-300 outline-none focus:border-teal-500/40"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setActionSearch(''); setFromDate(''); setToDate(''); resetPage(); }}
                className="w-full rounded-lg border border-white/10 py-2 text-xs text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {['Heure', 'Acteur', 'Action', 'Ressource', 'ID ressource', 'IP', 'Détails'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : isError ? (
              <tr>
                <td colSpan={7} className="p-4">
                  <QueryError
                    message="Impossible de charger les journaux d'audit."
                    onRetry={() => refetch()}
                  />
                </td>
              </tr>
            ) : !data || data.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Shield size={28} className="mx-auto mb-2 text-gray-700" />
                  <p className="text-sm text-gray-500">Aucun événement</p>
                </td>
              </tr>
            ) : (
              data.items.map((log) => (
                <tr key={log.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 text-[11px] text-gray-500 tabular-nums whitespace-nowrap">
                    {format(new Date(log.created_at), 'dd/MM HH:mm:ss', { locale: fr })}
                  </td>
                  <td className="px-4 py-3">
                    {log.actor_email ? (
                      <span className="text-xs text-gray-300">{log.actor_email}</span>
                    ) : (
                      <span className="text-xs text-gray-700 italic">supprimé</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold font-mono', actionColor(log.action))}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{log.resource_type ?? '—'}</td>
                  <td className="px-4 py-3">
                    {log.resource_id ? (
                      <span className="font-mono text-[10px] text-gray-600">{log.resource_id.slice(0, 8)}…</span>
                    ) : (
                      <span className="text-xs text-gray-700">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-gray-700">{log.ip ?? '—'}</td>
                  <td className="px-4 py-3">
                    {log.details && Object.keys(log.details).length > 0 ? (
                      <details className="group max-w-[220px]">
                        <summary className="cursor-pointer text-[10px] font-semibold text-teal-400 hover:text-teal-300">
                          Voir
                        </summary>
                        <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md bg-black/40 p-2 font-mono text-[9px] leading-relaxed text-gray-400">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-xs text-gray-700">—</span>
                    )}
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
          <span>Page {currentPage} / {totalPages} — {total.toLocaleString('fr-FR')} événements</span>
          <div className="flex gap-1">
            <button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={currentPage === 1} className="rounded-md p-1.5 hover:bg-white/10 disabled:opacity-30 transition-colors"><ChevronLeft size={14} /></button>
            <button onClick={() => setOffset(offset + PAGE_SIZE)} disabled={currentPage === totalPages} className="rounded-md p-1.5 hover:bg-white/10 disabled:opacity-30 transition-colors"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
