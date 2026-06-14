import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, MapPin, Activity, Clock, Wifi } from 'lucide-react';
import { containerService } from '@/services/containers';
import { STATUS_CONFIG } from '@/utils/status';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import type { ContainerStatus } from '@/types';

// ─── Gauge SVG ────────────────────────────────────────────────────────────────

function FillGauge({ value }: { value: number | null }) {
  if (value === null)
    return <p className="text-2xl font-bold text-gray-500">N/A</p>;

  const color = value >= 80 ? '#ef4444' : value >= 60 ? '#f59e0b' : '#22c55e';
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#1f2937" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x="50" y="54" textAnchor="middle" fill={color} fontSize="16" fontWeight="700" fontFamily="monospace">
          {value}%
        </text>
      </svg>
    </div>
  );
}

// ─── Status card ──────────────────────────────────────────────────────────────

function StatusCard({ status }: { status: ContainerStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="rounded-xl bg-gray-900 border border-white/10 p-4 flex flex-col items-center gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Statut</p>
      <span
        className={cn('rounded-full px-3 py-1 text-sm font-bold', cfg.color)}
        style={{ background: `${cfg.dot}18` }}
      >
        {cfg.label}
      </span>
      <span className="h-2 w-2 rounded-full mt-1" style={{ background: cfg.dot }} />
    </div>
  );
}

// ─── Custom tooltip (Recharts) ────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const color = val >= 80 ? '#ef4444' : val >= 60 ? '#f59e0b' : '#22c55e';
  return (
    <div className="rounded-lg bg-gray-900 border border-white/10 px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-0.5">{label}</p>
      <p className="font-bold" style={{ color }}>
        {val}%
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'info' | 'measurements';

export default function ContainerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canViewMeasurements = hasRole(['MANAGER', 'ADMIN']);
  const [activeTab, setActiveTab] = useState<Tab>('info');

  const { data: container, isLoading } = useQuery({
    queryKey: ['container', id],
    queryFn: () => containerService.getById(id!),
    enabled: Boolean(id),
  });

  const { data: measurements } = useQuery({
    queryKey: ['container-measurements', id],
    queryFn: () => containerService.getMeasurements(id!),
    enabled: Boolean(id) && canViewMeasurements && activeTab === 'measurements',
  });

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!container) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-gray-950 p-8">
        <p className="text-gray-400">Conteneur introuvable.</p>
        <button
          onClick={() => navigate('/containers')}
          className="text-sm text-emerald-500 hover:underline"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  const chartData = (measurements ?? [])
    .slice(-30)
    .map((m) => ({
      time: format(new Date(m.measured_at), 'dd/MM HH:mm', { locale: fr }),
      fill: m.fill_level,
      source: m.source,
    }));

  return (
    <div className="min-h-full bg-gray-950 p-6">
      {/* Breadcrumb */}
      <div className="mb-5 flex items-center gap-2 text-xs text-gray-500">
        <Link to="/containers" className="hover:text-gray-300 transition-colors">
          Conteneurs
        </Link>
        <span>/</span>
        <span className="text-gray-300 font-mono font-bold">{container.qr_code}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg p-2 text-gray-500 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white font-mono">{container.qr_code}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin size={12} className="text-gray-500" />
              <span className="text-xs text-gray-500">{container.zone_name ?? 'Zone non assignée'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatusCard status={container.status} />

        <div className="rounded-xl bg-gray-900 border border-white/10 p-4 flex flex-col items-center gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Remplissage
          </p>
          <FillGauge value={container.fill_level_latest} />
        </div>

        <div className="rounded-xl bg-gray-900 border border-white/10 p-4 flex flex-col items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Dernière mesure
          </p>
          <Clock size={22} className="text-gray-600 mt-1" />
          <p className="text-sm font-semibold text-gray-200 text-center">
            {container.last_measured_at
              ? format(new Date(container.last_measured_at), "dd MMM yyyy 'à' HH:mm", {
                  locale: fr,
                })
              : 'Jamais'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-gray-900/50 p-1 border border-white/5 w-fit">
        {([
          { key: 'info', label: 'Informations', icon: <Activity size={13} /> },
          ...(canViewMeasurements
            ? [{ key: 'measurements', label: 'Historique mesures', icon: <Wifi size={13} /> }]
            : []),
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all',
              activeTab === tab.key
                ? 'bg-emerald-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-300'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'info' && (
        <div className="rounded-xl bg-gray-900 border border-white/10 p-5">
          <dl className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-8">
            {[
              { label: 'QR Code', value: container.qr_code },
              { label: 'Zone', value: container.zone_name ?? '—' },
              { label: 'Type', value: container.type },
              { label: 'Capacité', value: `${container.capacity_l} L` },
              { label: 'Statut', value: STATUS_CONFIG[container.status].label },
              { label: 'Latitude', value: container.lat.toFixed(6) },
              { label: 'Longitude', value: container.lng.toFixed(6) },
              {
                label: 'Créé le',
                value: format(new Date(container.created_at), 'dd MMM yyyy', { locale: fr }),
              },
              {
                label: 'ID',
                value: container.id,
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {label}
                </dt>
                <dd className="mt-1 text-sm font-mono text-gray-200">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {activeTab === 'measurements' && (
        <div className="rounded-xl bg-gray-900 border border-white/10 p-5">
          <h2 className="mb-4 text-sm font-bold text-gray-300">
            Niveau de remplissage — 30 dernières mesures
          </h2>
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Wifi size={28} className="text-gray-700" />
              <p className="text-sm text-gray-500">Aucune mesure disponible</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: '#4b5563' }}
                  tickLine={false}
                  axisLine={{ stroke: '#1f2937' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#4b5563' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                  width={36}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="fill"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
