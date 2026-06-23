import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronLeft, UserCheck, Play, Flag, CheckCheck,
  AlertTriangle, Clock, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { routeService } from '@/services/routes';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/utils/cn';
import { getApiErrorMessage } from '@/utils/apiError';
import type { RouteOut, RouteStepOut, StepStatus, UserOut, PaginatedResponse } from '@/types';

// ─── Step status config ───────────────────────────────────────────────────────

const STEP_STATUS: Record<StepStatus, { label: string; color: string; dot: string; markerBg: string }> = {
  PENDING:  { label: 'En attente',  color: 'text-gray-400',  dot: '#6b7280', markerBg: '#374151' },
  DONE:     { label: 'Collecté',    color: 'text-green-400', dot: '#4ade80', markerBg: '#166534' },
  SKIPPED:  { label: 'Ignoré',      color: 'text-amber-400', dot: '#fbbf24', markerBg: '#78350f' },
  ISSUE:    { label: 'Problème',    color: 'text-red-400',   dot: '#f87171', markerBg: '#7f1d1d' },
};

function stepMarkerIcon(step: RouteStepOut) {
  const cfg = STEP_STATUS[step.status];
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${cfg.markerBg};border:2px solid ${cfg.dot};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:${cfg.dot};">${step.step_order}</div>`,
  });
}

// ─── Route status config ──────────────────────────────────────────────────────

const ROUTE_BADGE: Record<string, { label: string; color: string; dot: string }> = {
  DRAFT:       { label: 'Brouillon',  color: 'text-gray-400',  dot: '#6b7280' },
  ASSIGNED:    { label: 'Assignée',   color: 'text-blue-400',  dot: '#60a5fa' },
  IN_PROGRESS: { label: 'En cours',   color: 'text-amber-400', dot: '#fbbf24' },
  DONE:        { label: 'Terminée',   color: 'text-green-400', dot: '#4ade80' },
  CANCELLED:   { label: 'Annulée',    color: 'text-red-400',   dot: '#f87171' },
};

// ─── Assign modal ─────────────────────────────────────────────────────────────

function AssignModal({ routeId, currentAgentId, onClose }: { routeId: string; currentAgentId: string | null; onClose: () => void }) {
  const [agentId, setAgentId] = useState(currentAgentId ?? '');
  const qc = useQueryClient();

  const { data: agentsData, isLoading: agentsLoading, isError: agentsError } = useQuery({
    queryKey: ['agents-select'],
    queryFn: () =>
      api.get<PaginatedResponse<UserOut>>('/users', {
        params: { role: 'AGENT', status: 'ACTIVE', limit: 100 },
        _suppressErrorToast: true,
      }).then((r) => r.data),
    retry: false,
    throwOnError: false,
  });

  const agents = agentsData?.items ?? [];

  const assign = useMutation({
    mutationFn: () => routeService.assign(routeId, agentId.trim()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['route', routeId] }); toast.success('Agent assigné'); onClose(); },
    onError: () => toast.error('Assignation impossible'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-bold text-white">Assigner un agent</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-400">Agent</label>
            {agentsLoading ? (
              <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <span className="text-xs text-gray-500">Chargement des agents…</span>
              </div>
            ) : !agentsError && agents.length > 0 ? (
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
              >
                <option value="">Sélectionner un agent…</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name} ({a.email})
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 font-mono text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-blue-500/50"
              />
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-gray-400 hover:bg-white/5 transition-colors">Annuler</button>
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

// ─── Tour map ─────────────────────────────────────────────────────────────────

function TourMap({ route }: { route: RouteOut }) {
  const positions = route.steps.map((s): [number, number] => [s.lat, s.lng]);
  const center: [number, number] = positions.length > 0
    ? [
        positions.reduce((a, p) => a + p[0], 0) / positions.length,
        positions.reduce((a, p) => a + p[1], 0) / positions.length,
      ]
    : [48.8566, 2.3522];

  return (
    <div className="h-full min-h-[320px] overflow-hidden rounded-xl border border-white/10">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        {positions.length > 1 && (
          <Polyline positions={positions} pathOptions={{ color: '#0d9488', weight: 2, dashArray: '5 3', opacity: 0.7 }} />
        )}
        {route.steps.map((step) => (
          <Marker key={step.id} position={[step.lat, step.lng]} icon={stepMarkerIcon(step)}>
            <Popup>
              <div className="min-w-[140px] font-sans text-xs">
                <p className="font-bold text-gray-900">#{step.step_order} — {step.qr_code}</p>
                <p className={cn('mt-1 font-semibold', STEP_STATUS[step.status].color)}>
                  {STEP_STATUS[step.status].label}
                </p>
                {step.collected_at && (
                  <p className="text-gray-500 mt-0.5">
                    {format(new Date(step.collected_at), 'HH:mm', { locale: fr })}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// ─── Step list ────────────────────────────────────────────────────────────────

function StepList({
  route,
  canAct,
  onValidate,
  onIssue,
}: {
  route: RouteOut;
  canAct: boolean;
  onValidate: (stepId: string) => void;
  onIssue: (stepId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {route.steps.map((step) => {
        const cfg = STEP_STATUS[step.status];
        return (
          <div
            key={step.id}
            className={cn(
              'rounded-xl border p-3 transition-all',
              step.status === 'DONE'    ? 'border-green-500/20 bg-green-500/5' :
              step.status === 'ISSUE'   ? 'border-red-500/20 bg-red-500/5' :
              step.status === 'SKIPPED' ? 'border-amber-500/20 bg-amber-500/5' :
              'border-white/5 bg-white/2'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: `${cfg.dot}20`, color: cfg.dot }}
                >
                  {step.step_order}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-xs font-bold text-gray-200 truncate">{step.qr_code}</p>
                  {step.collected_at && (
                    <p className="text-[10px] text-gray-500 flex items-center gap-0.5">
                      <Clock size={9} />
                      {format(new Date(step.collected_at), 'HH:mm', { locale: fr })}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={cn('text-[10px] font-semibold hidden sm:block', cfg.color)}>
                  {cfg.label}
                </span>
                {canAct && step.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => onValidate(step.id)}
                      className="flex items-center gap-1 rounded-lg bg-green-500/15 px-2 py-1 text-[10px] font-bold text-green-400 hover:bg-green-500/25 transition-colors"
                    >
                      <CheckCheck size={11} /> OK
                    </button>
                    <button
                      onClick={() => onIssue(step.id)}
                      className="flex items-center gap-1 rounded-lg bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-400 hover:bg-amber-500/25 transition-colors"
                    >
                      <AlertTriangle size={11} /> Pb
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TourDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isManager = hasRole(['MANAGER', 'ADMIN']);
  const { user: storeUser } = useAuthStore();

  const [showAssign, setShowAssign] = useState(false);
  const qc = useQueryClient();

  const isActive = (r?: RouteOut) => r?.status === 'IN_PROGRESS';
  const { data: route, isLoading } = useQuery({
    queryKey: ['route', id],
    queryFn: () => routeService.getById(id!),
    enabled: Boolean(id),
    refetchInterval: (query) => (isActive(query.state.data) ? 10000 : false),
  });

  const mutOpts = (msg: string) => ({
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['route', id] }); toast.success(msg); },
    // UX-25 — remonter le détail métier (422) renvoyé par le backend si présent.
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Action impossible')),
  });

  const startM    = useMutation({ mutationFn: () => routeService.start(id!),    ...mutOpts('Tournée démarrée') });
  const completeM = useMutation({ mutationFn: () => routeService.complete(id!), ...mutOpts('Tournée terminée') });
  const validateM = useMutation({ mutationFn: (sid: string) => routeService.validateStep(sid), ...mutOpts('Collecte validée') });
  const issueM    = useMutation({ mutationFn: (sid: string) => routeService.issueStep(sid),    ...mutOpts('Problème signalé') });

  if (isLoading) return (
    <div className="flex min-h-full items-center justify-center bg-gray-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
    </div>
  );
  if (!route) return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 bg-gray-950">
      <p className="text-gray-400 text-sm">Tournée introuvable.</p>
      <button
        onClick={() => navigate(isManager ? '/tours' : '/my-tours')}
        className="text-sm text-teal-500 hover:underline"
      >
        Retour
      </button>
    </div>
  );

  // UX-12 — l'agent n'a pas accès à /tours ; il revient sur /my-tours.
  const toursPath = isManager ? '/tours' : '/my-tours';

  const badge = ROUTE_BADGE[route.status];
  const isAssignedToMe = route.agent_id === storeUser?.id;
  const canAgentAct = !isManager && isAssignedToMe && (route.status === 'ASSIGNED' || route.status === 'IN_PROGRESS');
  // UX-10/TECH-13 — une tournée se termine dès qu'aucune étape n'est PENDING
  // (DONE / SKIPPED / ISSUE sont des états terminaux).
  const nonePending = route.steps.length > 0 && route.steps.every((s) => s.status !== 'PENDING');
  const doneCount = route.steps.filter((s) => s.status !== 'PENDING').length;

  return (
    <div className="min-h-full bg-gray-950 p-4 lg:p-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
        <Link to={toursPath} className="hover:text-gray-300 transition-colors">
          {isManager ? 'Tournées' : 'Mes tournées'}
        </Link>
        <span>/</span>
        <span className="text-gray-300">{route.zone_name}</span>
      </div>

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start gap-3 justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="rounded-lg p-2 text-gray-500 hover:bg-white/10 hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">{route.zone_name}</h1>
            <p className="text-xs text-gray-500">
              {format(new Date(route.scheduled_date), 'EEEE dd MMMM yyyy', { locale: fr })}
              {route.agent_name && <span className="ml-2 text-blue-400">· {route.agent_name}</span>}
            </p>
          </div>
          <span
            className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', badge.color)}
            style={{ background: `${badge.dot}18` }}
          >
            {badge.label}
          </span>
        </div>

        {/* Manager actions */}
        {isManager && (route.status === 'DRAFT' || route.status === 'ASSIGNED') && (
          <button
            onClick={() => setShowAssign(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 px-3 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-600/30 transition-colors"
          >
            <UserCheck size={14} /> {route.agent_name ? 'Réassigner' : 'Assigner'}
          </button>
        )}

        {/* Agent actions */}
        {canAgentAct && route.status === 'ASSIGNED' && (
          <button
            onClick={() => startM.mutate()}
            disabled={startM.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50 shadow-lg shadow-teal-500/20 transition-all"
          >
            <Play size={14} /> Démarrer
          </button>
        )}
        {canAgentAct && route.status === 'IN_PROGRESS' && nonePending && (
          <button
            onClick={() => completeM.mutate()}
            disabled={completeM.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-all"
          >
            <Flag size={14} /> Terminer
          </button>
        )}
      </div>

      {/* Progress bar (agent IN_PROGRESS) */}
      {route.status === 'IN_PROGRESS' && (
        <div className="mb-4 rounded-xl bg-gray-900 border border-white/10 px-4 py-3">
          <div className="mb-1.5 flex justify-between text-xs font-semibold">
            <span className="text-gray-400">Progression</span>
            <span className="text-teal-400">{doneCount}/{route.steps.length} étapes</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-teal-500 transition-all duration-500"
              style={{ width: `${(doneCount / Math.max(1, route.steps.length)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        {/* Map */}
        <div className="lg:sticky lg:top-4">
          <TourMap route={route} />
          {route.estimated_distance && (
            <p className="mt-2 text-center text-xs text-gray-600">
              Distance estimée : {route.estimated_distance.toFixed(1)} km
            </p>
          )}
        </div>

        {/* Steps */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
            Étapes ({route.steps.length})
          </p>
          <StepList
            route={route}
            canAct={canAgentAct && route.status === 'IN_PROGRESS'}
            onValidate={(sid) => validateM.mutate(sid)}
            onIssue={(sid) => issueM.mutate(sid)}
          />
        </div>
      </div>

      {showAssign && <AssignModal routeId={route.id} currentAgentId={route.agent_id} onClose={() => setShowAssign(false)} />}
    </div>
  );
}
