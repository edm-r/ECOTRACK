import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Trophy, Star, Clock, AlertCircle, Loader2, KeyRound, Check } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { authService } from '@/services/auth';
import { reportService } from '@/services/reports';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/utils/cn';
import type { ReportStatus, UserRole } from '@/types';

// ─── Role badge config ────────────────────────────────────────────────────────

const ROLE_BADGE: Record<UserRole, { label: string; className: string }> = {
  CITIZEN: { label: 'Citoyen', className: 'bg-blue-500/10 text-blue-400' },
  AGENT: { label: 'Agent', className: 'bg-amber-500/10 text-amber-400' },
  MANAGER: { label: 'Gestionnaire', className: 'bg-emerald-500/10 text-emerald-400' },
  ADMIN: { label: 'Administrateur', className: 'bg-red-500/10 text-red-400' },
};

// ─── Account section (tous les rôles) ─────────────────────────────────────────

function AccountSection({ fullName }: { fullName: string }) {
  const { user } = useAuth();
  const { setSession } = useAuthStore();
  const [name, setName] = useState(fullName);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: (payload: { full_name?: string; password?: string }) =>
      authService.updateMe(payload),
    onSuccess: (updated) => {
      // Garder le store cohérent (le nom affiché dans la barre latérale, etc.).
      const store = useAuthStore.getState();
      if (store.token && store.refreshToken) {
        setSession(store.token, store.refreshToken, updated);
      }
      setPassword('');
      setConfirm('');
      setPwError(null);
      toast.success('Profil mis à jour');
    },
    onError: (err: AxiosError<{ detail?: unknown }>) => {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Mise à jour impossible');
    },
  });

  const onSaveName = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error('Le nom doit contenir au moins 2 caractères');
      return;
    }
    if (trimmed === fullName) return;
    update.mutate({ full_name: trimmed });
  };

  const onChangePassword = () => {
    setPwError(null);
    if (password.length < 8) {
      setPwError('Minimum 8 caractères');
      return;
    }
    if (password !== confirm) {
      setPwError('Les mots de passe ne correspondent pas');
      return;
    }
    update.mutate({ password });
  };

  const field =
    'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 placeholder-gray-600';

  return (
    <div className="rounded-2xl bg-gray-900 border border-white/10 overflow-hidden">
      <div className="border-b border-white/5 px-5 py-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Mon compte</h2>
      </div>
      <div className="space-y-5 p-5">
        {/* Nom complet */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-400">Nom complet</label>
          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
            <button
              onClick={onSaveName}
              disabled={update.isPending || name.trim() === fullName}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
            >
              {update.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Enregistrer
            </button>
          </div>
        </div>

        {/* Email (lecture seule) */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-400">Email</label>
          <div className="rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-500">{user?.email}</div>
        </div>

        {/* Changement de mot de passe */}
        <div className="border-t border-white/5 pt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-400">
            <KeyRound size={13} /> Changer le mot de passe
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={field}
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Confirmer"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={field}
            />
          </div>
          {pwError && <p className="mt-1.5 text-xs text-red-400">{pwError}</p>}
          <button
            onClick={onChangePassword}
            disabled={update.isPending || !password || !confirm}
            className="mt-3 flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm font-semibold text-gray-200 hover:bg-white/10 disabled:opacity-40 transition-colors"
          >
            {update.isPending ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
            Mettre à jour le mot de passe
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const isCitizen = user?.role === 'CITIZEN';

  // Gamification (points + signalements) réservée aux citoyens (UX-08).
  const { data: points, isLoading: pointsLoading } = useQuery({
    queryKey: ['my-points'],
    queryFn: authService.getMyPoints,
    enabled: isCitizen,
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['my-reports'],
    queryFn: reportService.listMine,
    enabled: isCitizen,
  });

  const roleBadge = user ? ROLE_BADGE[user.role] : null;

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
              {roleBadge && (
                <span
                  className={cn(
                    'mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    roleBadge.className
                  )}
                >
                  {roleBadge.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Compte (tous les rôles) ────────────────────────── */}
        <AccountSection fullName={user?.full_name ?? ''} />

        {/* ── Points card (citoyens uniquement) ──────────────── */}
        {isCitizen && (
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
        )}

        {/* ── Mes signalements (citoyens uniquement) ─────────── */}
        {isCitizen && (
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
        )}
      </div>
    </div>
  );
}
