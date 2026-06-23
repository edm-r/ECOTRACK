import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Package, AlertTriangle, Eye, CheckCircle2,
  Bell, Flag, CheckCheck, Route, Leaf, HelpCircle,
  RefreshCw, Activity, Gauge,
} from 'lucide-react';
import { analyticsService } from '@/services/analytics';
import { cn } from '@/utils/cn';
import { QueryError } from '@/components/ui/QueryError';
import type { KpiDashboard, TopZone, TimeseriesPoint } from '@/types';

// ─── Tooltip style ────────────────────────────────────────────────────────────

const TT = {
  contentStyle: {
    background: '#111827',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    fontSize: '12px',
  },
  labelStyle: { color: '#9ca3af', fontSize: '11px', marginBottom: '2px' },
  itemStyle: { color: '#e5e7eb' },
};

// ─── KPI card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
  iconBg: string;
  dim?: boolean;
}

function KpiCard({ label, value, icon, accent, iconBg, dim }: KpiCardProps) {
  return (
    <div className={cn('rounded-xl border border-white/10 bg-gray-900 p-4', dim && 'opacity-60')}>
      <div className={cn('mb-3 h-0.5 rounded-full', accent)} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-black text-white tabular-nums">{value}</p>
        </div>
        <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl', iconBg)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Status pie chart ─────────────────────────────────────────────────────────

const STATUS_COLORS = [
  { name: 'Critiques',   color: '#ef4444' },
  { name: 'Surveillance', color: '#f59e0b' },
  { name: 'Normaux',     color: '#22c55e' },
  { name: 'Inconnus',    color: '#6b7280' },
];

function StatusPie({ kpi }: { kpi: KpiDashboard }) {
  const data = [
    { name: 'Critiques',    value: kpi.containers_critical },
    { name: 'Surveillance', value: kpi.containers_watch },
    { name: 'Normaux',      value: kpi.containers_normal },
    { name: 'Inconnus',     value: kpi.containers_unknown },
  ].filter((d) => d.value > 0);

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900 p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Répartition statuts</p>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_entry, i) => (
              <Cell key={i} fill={STATUS_COLORS[i]?.color ?? '#6b7280'} />
            ))}
          </Pie>
          <Tooltip
            {...TT}
            // Recharts formatter typing workaround — Recharts types `value` as
            // number|string|array at runtime; we know it's a number here.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((v: number, name: string) => [v, name]) as any}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {STATUS_COLORS.map(({ name, color }) => (
          <span key={name} className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Fill timeseries chart ────────────────────────────────────────────────────

function FillChart({ data }: { data: TimeseriesPoint[] }) {
  const formatted = data.map((p) => ({
    ...p,
    label: format(new Date(p.ts), 'dd/MM', { locale: fr }),
  }));

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900 p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
        Remplissage moyen — 7 derniers jours
      </p>
      {data.length === 0 ? (
        <div className="flex h-[160px] items-center justify-center text-xs text-gray-700">
          Aucune donnée
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              width={36}
            />
            <Tooltip
              {...TT}
              // Recharts formatter typing workaround — value is number|string at runtime.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((v: number) => [`${v.toFixed(1)}%`, 'Remplissage']) as any}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#0d9488"
              strokeWidth={2}
              fill="url(#fillGrad)"
              dot={{ fill: '#0d9488', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Top zones chart ──────────────────────────────────────────────────────────

function TopZonesChart({ zones }: { zones: TopZone[] }) {
  const data = zones.map((z) => ({ ...z, fill: z.avg_fill_level }));

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900 p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
        Top zones — remplissage moyen
      </p>
      {zones.length === 0 ? (
        <div className="flex h-[160px] items-center justify-center text-xs text-gray-700">
          Aucune donnée
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(120, zones.length * 32)}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="zone_name"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip
              {...TT}
              // Recharts formatter typing workaround — value is number|string at runtime.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((v: number) => [`${v.toFixed(1)}%`, 'Remplissage moyen']) as any}
            />
            <Bar dataKey="fill" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {data.map((z, i) => (
                <Cell
                  key={i}
                  fill={z.fill >= 80 ? '#ef4444' : z.fill >= 60 ? '#f59e0b' : '#22c55e'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-gray-900 p-4">
      <div className="mb-3 h-0.5 rounded-full bg-white/5" />
      <div className="space-y-2">
        <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
        <div className="h-7 w-2/3 animate-pulse rounded bg-white/5" />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const dateRange = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 7);
    return {
      to: to.toISOString().split('T')[0],
      from: from.toISOString().split('T')[0],
    };
  }, []);

  const { data: kpi, isLoading: kpiLoading, isError: kpiError, refetch: refetchKpi, dataUpdatedAt } = useQuery({
    queryKey: ['kpis'],
    queryFn: analyticsService.getKpis,
    refetchInterval: 30000,
  });

  const { data: fillSeries = [] } = useQuery({
    queryKey: ['timeseries', 'avg_fill', dateRange],
    queryFn: () => analyticsService.getTimeseries({ metric: 'avg_fill', granularity: 'day', ...dateRange }),
    refetchInterval: 30000,
  });

  const { data: topZones = [] } = useQuery({
    queryKey: ['top-zones'],
    queryFn: () => analyticsService.getTopZones(6),
    refetchInterval: 30000,
  });

  const lastUpdated = dataUpdatedAt ? format(new Date(dataUpdatedAt), 'HH:mm:ss', { locale: fr }) : null;

  const kpiCards = kpi
    ? [
        // Conteneurs
        { label: 'Conteneurs', value: kpi.containers_total, icon: <Package size={16} className="text-blue-400" />, accent: 'bg-blue-500', iconBg: 'bg-blue-500/15' },
        { label: 'Critiques', value: kpi.containers_critical, icon: <AlertTriangle size={16} className="text-red-400" />, accent: 'bg-red-500', iconBg: 'bg-red-500/15', dim: kpi.containers_critical === 0 },
        { label: 'Surveillance', value: kpi.containers_watch, icon: <Eye size={16} className="text-amber-400" />, accent: 'bg-amber-500', iconBg: 'bg-amber-500/15', dim: kpi.containers_watch === 0 },
        { label: 'Normaux', value: kpi.containers_normal, icon: <CheckCircle2 size={16} className="text-green-400" />, accent: 'bg-green-500', iconBg: 'bg-green-500/15' },
        { label: 'Remplissage moyen', value: `${kpi.avg_fill_level.toFixed(1)}%`, icon: <Gauge size={16} className="text-indigo-400" />, accent: 'bg-indigo-500', iconBg: 'bg-indigo-500/15' },
        { label: 'Inconnus', value: kpi.containers_unknown, icon: <HelpCircle size={16} className="text-gray-500" />, accent: 'bg-gray-600', iconBg: 'bg-gray-700', dim: true },
        // Opérations
        { label: 'Alertes actives', value: kpi.alerts_open, icon: <Bell size={16} className={kpi.alerts_open > 0 ? 'text-red-400' : 'text-gray-500'} />, accent: kpi.alerts_open > 0 ? 'bg-red-500' : 'bg-gray-600', iconBg: kpi.alerts_open > 0 ? 'bg-red-500/15' : 'bg-gray-700', dim: kpi.alerts_open === 0 },
        { label: 'Signalements ouverts', value: kpi.reports_open, icon: <Flag size={16} className="text-amber-400" />, accent: 'bg-amber-500', iconBg: 'bg-amber-500/15', dim: kpi.reports_open === 0 },
        { label: 'Résolus 7j', value: kpi.reports_resolved_7d, icon: <CheckCheck size={16} className="text-green-400" />, accent: 'bg-green-500', iconBg: 'bg-green-500/15' },
        { label: 'Tournées actives', value: kpi.routes_active, icon: <Route size={16} className="text-blue-400" />, accent: 'bg-blue-500', iconBg: 'bg-blue-500/15', dim: kpi.routes_active === 0 },
        { label: 'Tournées 7j', value: kpi.routes_completed_7d, icon: <Activity size={16} className="text-teal-400" />, accent: 'bg-teal-500', iconBg: 'bg-teal-500/15' },
        { label: 'CO₂ évité 7j', value: `${kpi.co2_estimated_kg_7d.toFixed(1)} kg`, icon: <Leaf size={16} className="text-emerald-400" />, accent: 'bg-emerald-500', iconBg: 'bg-emerald-500/15' },
      ]
    : null;

  return (
    <div className="min-h-full bg-gray-950 p-4 lg:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Tableau de bord</h1>
          <p className="mt-0.5 text-xs text-gray-600 capitalize">
            {format(new Date(), 'EEEE dd MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="flex items-center gap-1.5 text-[10px] text-gray-600">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
              MàJ {lastUpdated}
            </span>
          )}
          <button
            onClick={() => refetchKpi()}
            className="rounded-lg p-2 text-gray-600 hover:bg-white/5 hover:text-gray-300 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Erreur de chargement (UX-24) */}
      {kpiError && (
        <QueryError
          className="mb-5"
          message="Impossible de charger les indicateurs du tableau de bord."
          onRetry={() => refetchKpi()}
        />
      )}

      {/* KPI grid */}
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {kpiLoading
          ? Array.from({ length: 12 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpiCards?.map((c) => (
              <KpiCard
                key={c.label}
                label={c.label}
                value={c.value}
                icon={c.icon}
                accent={c.accent}
                iconBg={c.iconBg}
                dim={c.dim}
              />
            ))}
      </div>

      {/* Charts — top row: fill timeseries + status pie */}
      <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FillChart data={fillSeries} />
        </div>
        <div>
          {kpi ? <StatusPie kpi={kpi} /> : (
            <div className="rounded-xl border border-white/10 bg-gray-900 p-4">
              <div className="h-[200px] animate-pulse rounded-lg bg-white/5" />
            </div>
          )}
        </div>
      </div>

      {/* Charts — bottom: top zones */}
      <TopZonesChart zones={topZones} />
    </div>
  );
}
