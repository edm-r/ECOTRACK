import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CalendarCheck, CheckCircle2, AlertTriangle, MapPin,
  Play, Flag, PackageSearch,
} from 'lucide-react';
import { toast } from 'sonner';
import { routeService } from '@/services/routes';
import { cn } from '@/utils/cn';
import { getApiErrorMessage } from '@/utils/apiError';
import type { RouteOut, RouteStepOut, StepStatus } from '@/types';

// ─── Step card ────────────────────────────────────────────────────────────────

function StepCard({
  step,
  routeId,
  canAct,
}: {
  step: RouteStepOut;
  routeId: string;
  canAct: boolean;
}) {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['my-routes'] });
    qc.invalidateQueries({ queryKey: ['route', routeId] });
  };

  const validate = useMutation({
    mutationFn: () => routeService.validateStep(step.id),
    onSuccess: () => { invalidate(); toast.success('Collecte validée !'); },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Erreur lors de la validation')),
  });

  const issue = useMutation({
    mutationFn: () => routeService.issueStep(step.id),
    onSuccess: () => { invalidate(); toast.success('Problème signalé'); },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Erreur lors du signalement')),
  });

  const bg: Record<StepStatus, string> = {
    PENDING:  'bg-white border-gray-200',
    DONE:     'bg-green-50 border-green-200',
    ISSUE:    'bg-amber-50 border-amber-200',
    SKIPPED:  'bg-gray-50 border-gray-200',
  };

  const numColor: Record<StepStatus, string> = {
    PENDING:  'bg-gray-200 text-gray-700',
    DONE:     'bg-green-500 text-white',
    ISSUE:    'bg-amber-500 text-white',
    SKIPPED:  'bg-gray-300 text-gray-500',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3.5 shadow-sm transition-all',
        bg[step.status],
        step.status === 'DONE' && 'opacity-70'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Step number */}
        <span
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold',
            numColor[step.status]
          )}
        >
          {step.status === 'DONE' ? (
            <CheckCircle2 size={16} />
          ) : step.status === 'ISSUE' ? (
            <AlertTriangle size={16} />
          ) : (
            step.step_order
          )}
        </span>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className={cn(
            'font-mono text-sm font-bold',
            step.status === 'DONE' ? 'text-green-700 line-through decoration-green-400/50' :
            step.status === 'ISSUE' ? 'text-amber-700' : 'text-gray-800'
          )}>
            {step.qr_code}
          </p>
          {step.collected_at ? (
            <p className="mt-0.5 text-xs text-gray-500 flex items-center gap-1">
              <CheckCircle2 size={10} className="text-green-500" />
              Collecté à {format(new Date(step.collected_at), 'HH:mm', { locale: fr })}
            </p>
          ) : (
            <p className="mt-0.5 flex items-center gap-0.5 text-xs text-gray-400">
              <MapPin size={10} />
              Étape {step.step_order}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons — only for PENDING steps when active */}
      {canAct && step.status === 'PENDING' && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => validate.mutate()}
            disabled={validate.isPending || issue.isPending}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-green-500 text-sm font-bold text-white shadow-sm active:scale-95 hover:bg-green-600 disabled:opacity-50 transition-all"
          >
            <CheckCircle2 size={16} />
            Collecté
          </button>
          <button
            onClick={() => issue.mutate()}
            disabled={validate.isPending || issue.isPending}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-amber-400 text-sm font-bold text-white shadow-sm active:scale-95 hover:bg-amber-500 disabled:opacity-50 transition-all"
          >
            <AlertTriangle size={16} />
            Problème
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Active tour view ─────────────────────────────────────────────────────────

function ActiveTour({ route }: { route: RouteOut }) {
  const qc = useQueryClient();

  const mutOpts = (msg: string) => ({
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-routes'] }); toast.success(msg); },
    // UX-25 — afficher le détail métier (422) renvoyé par le backend si présent.
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Action impossible')),
  });

  const startM    = useMutation({ mutationFn: () => routeService.start(route.id),    ...mutOpts('Tournée démarrée !') });
  const completeM = useMutation({ mutationFn: () => routeService.complete(route.id), ...mutOpts('Tournée terminée !') });

  const doneCount = route.steps.filter((s) => s.status !== 'PENDING').length;
  // UX-10/TECH-13 — terminable dès qu'aucune étape n'est PENDING (DONE/SKIPPED/ISSUE terminaux).
  const nonePending = route.steps.length > 0 && route.steps.every((s) => s.status !== 'PENDING');
  const progressPct = (doneCount / Math.max(1, route.steps.length)) * 100;
  const isInProgress = route.status === 'IN_PROGRESS';

  return (
    <div>
      {/* Route header card */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">Zone</p>
            <p className="mt-0.5 text-lg font-black text-gray-900">{route.zone_name}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
              <CalendarCheck size={11} />
              {format(new Date(route.scheduled_date), 'EEEE dd MMMM', { locale: fr })}
            </p>
          </div>
          <span className={cn(
            'rounded-full px-3 py-1 text-xs font-bold',
            route.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
          )}>
            {route.status === 'IN_PROGRESS' ? 'En cours' : 'Assignée'}
          </span>
        </div>

        {/* Progress */}
        {isInProgress && (
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs font-semibold">
              <span className="text-gray-500">Progression</span>
              <span className="text-teal-600">{doneCount}/{route.steps.length} étapes</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-teal-500 transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main CTA */}
      {route.status === 'ASSIGNED' && (
        <button
          onClick={() => startM.mutate()}
          disabled={startM.isPending}
          className="mt-4 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-teal-500 text-base font-black text-white shadow-lg shadow-teal-500/25 active:scale-[0.98] hover:bg-teal-600 disabled:opacity-50 transition-all"
        >
          <Play size={20} />
          {startM.isPending ? 'Démarrage…' : 'Démarrer la tournée'}
        </button>
      )}

      {isInProgress && nonePending && (
        <button
          onClick={() => completeM.mutate()}
          disabled={completeM.isPending}
          className="mt-4 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-green-500 text-base font-black text-white shadow-lg shadow-green-500/25 active:scale-[0.98] hover:bg-green-600 disabled:opacity-50 transition-all"
        >
          <Flag size={20} />
          {completeM.isPending ? 'Finalisation…' : 'Terminer la tournée'}
        </button>
      )}

      {/* Steps list */}
      {isInProgress && (
        <div className="mt-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
            Étapes à collecter
          </p>
          <div className="flex flex-col gap-2.5">
            {route.steps.map((step) => (
              <StepCard
                key={step.id}
                step={step}
                routeId={route.id}
                canAct={isInProgress}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <PackageSearch size={28} className="text-gray-400" />
      </div>
      <p className="text-base font-bold text-gray-700">Aucune tournée aujourd'hui</p>
      <p className="mt-1.5 max-w-[220px] text-sm text-gray-400">
        Votre responsable vous assignera une tournée prochainement.
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MyToursPage() {
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['my-routes'],
    queryFn: routeService.listMine,
    refetchInterval: (query) => {
      const active = query.state.data?.some(
        (r) => r.status === 'IN_PROGRESS'
      );
      return active ? 10000 : false;
    },
  });

  const today = format(new Date(), 'EEEE dd MMMM yyyy', { locale: fr });

  const activeRoute = routes.find(
    (r) => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED'
  );

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{today}</p>
        <h1 className="mt-0.5 text-xl font-black text-gray-900">Mes tournées du jour</h1>
      </div>

      <div className="px-4 py-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          </div>
        ) : activeRoute ? (
          <ActiveTour route={activeRoute} />
        ) : (
          <EmptyState />
        )}

        {/* Completed tours today */}
        {!isLoading && routes.filter((r) => r.status === 'DONE').length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
              Terminées
            </p>
            <div className="flex flex-col gap-2">
              {routes
                .filter((r) => r.status === 'DONE')
                .map((r) => (
                  <div key={r.id} className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-green-800">{r.zone_name}</p>
                        <p className="text-xs text-green-600">
                          {r.steps.filter((s) => s.status === 'DONE').length}/{r.steps.length} collectés
                        </p>
                      </div>
                      <CheckCircle2 size={20} className="text-green-500" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
