import { useQuery } from '@tanstack/react-query';
import { Trophy, Star, Clock, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { authService } from '@/services/auth';
import { reportService } from '@/services/reports';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import type { ReportStatus } from '@/types';

// ─── Report status config ─────────────────────────────────────────────────────

const REPORT_STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; dot: string }> = {
  OPEN: { label: 'Ouvert', color: 'text-blue-400', dot: '#60a5fa' },
  CONFIRMED: { label: 'Confirmé', color: 'text-amber-500', dot: '#f59e0b' },
  RESOLVED: { label: 'Résolu', color: 'text-green-500', dot: '#22c55e' },
  REJECTED: { label: 'Rejeté', color: 'text-gray-500', dot: '#6b7280' },
};

// ─── Points counter ───────────────────────────────────────────────────────────

function PointsCounter({ value }: { value: number }) {
  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      {/* Glow ring */}
      <div className="absolute inset-0 rounded-full bg-emerald-500/5 blur-3xl" />
      <Trophy size={28} className="mb-3 text-emerald-400" />
      <span className="text-5xl font-black text-white tracking-tight tabular-nums">
        {value.toLocaleString('fr-FR')}
      </span>
      <span className="mt-1 text-sm font-semibold text-emerald-400/80">points</span>
    </div>
  );
}

// ─── Timeline event ───────────────────────────────────────────────────────────

function PointEvent({
  source,
  points,
  date,
  isLast,
}: {
  source: string;
  points: number;
  date: string;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
          <Star size={12} className="text-emerald-400" />
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-white/5" />}
      </div>
      <div className={cn('pb-4 min-w-0', isLast && 'pb-0')}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-300 truncate">{source}</p>
          <span className="flex-shrink-0 text-sm font-bold text-emerald-400">
            +{points}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-gray-600">
          {formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })}
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuth();

  const { data: points, isLoading: pointsLoading } = useQuery({
    queryKey: ['my-points'],
    queryFn: authService.getMyPoints,
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['my-reports'],
    queryFn: reportService.listMine,
  });

  const initials = user?.full_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  return (
    <div className="min-h-full bg-gray-950 p-6">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* ── Profile header ─────────────────────────────────── */}
        <div className="rounded-2xl bg-gray-900 border border-white/10 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xl font-black text-white shadow-lg shadow-emerald-600/20">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white truncate">{user?.full_name}</h1>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              <span className="mt-1.5 inline-block rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
                Citoyen
              </span>
            </div>
          </div>
        </div>

        {/* ── Points card ────────────────────────────────────── */}
        <div className="rounded-2xl bg-gray-900 border border-white/10 overflow-hidden">
          <div className="border-b border-white/5 px-5 py-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Mes points
            </h2>
          </div>

          {pointsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : !points ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <AlertCircle size={24} className="text-gray-700" />
              <p className="text-sm text-gray-500">Points indisponibles</p>
            </div>
          ) : (
            <div className="px-5 pb-5">
              <PointsCounter value={points.total_points} />

              {points.events.length > 0 && (
                <div className="mt-4 border-t border-white/5 pt-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Historique
                  </h3>
                  <div>
                    {points.events.slice(0, 10).map((ev, i) => (
                      <PointEvent
                        key={`${ev.created_at}-${i}`}
                        source={ev.source}
                        points={ev.points}
                        date={ev.created_at}
                        isLast={i === Math.min(points.events.length, 10) - 1}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Mes signalements ───────────────────────────────── */}
        <div className="rounded-2xl bg-gray-900 border border-white/10 overflow-hidden">
          <div className="border-b border-white/5 px-5 py-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Mes signalements
            </h2>
            {reports && (
              <span className="text-xs text-gray-600">{reports.length} au total</span>
            )}
          </div>

          {reportsLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : !reports || reports.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <AlertCircle size={24} className="text-gray-700" />
              <p className="text-sm text-gray-500">Aucun signalement pour l'instant</p>
              <p className="text-xs text-gray-700">
                Vos signalements de problèmes apparaîtront ici.
              </p>
            </div>
          ) : (
            <ul>
              {reports.map((r, i) => {
                const sCfg = REPORT_STATUS_CONFIG[r.status];
                const typeLabels: Record<string, string> = {
                  FULL: 'Plein',
                  DAMAGED: 'Endommagé',
                  BLOCKED: 'Inaccessible',
                  OTHER: 'Autre',
                };
                return (
                  <li
                    key={r.id}
                    className={cn(
                      'flex items-center justify-between px-5 py-3',
                      i < reports.length - 1 && 'border-b border-white/5'
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-500">
                          #{r.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs font-semibold text-gray-300">
                          {typeLabels[r.type] ?? r.type}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-600">
                        <Clock size={10} />
                        <span>
                          {format(new Date(r.created_at), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      </div>
                    </div>
                    <span
                      className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0 ml-3', sCfg.color)}
                      style={{ background: `${sCfg.dot}18` }}
                    >
                      {sCfg.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
