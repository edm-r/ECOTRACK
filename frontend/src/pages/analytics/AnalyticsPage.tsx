import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { Download, ChevronDown, TrendingUp, AlertTriangle, FileDown, X } from 'lucide-react';
import { toast } from 'sonner';
import { analyticsService } from '@/services/analytics';
import { containerService } from '@/services/containers';
import { zoneService } from '@/services/zones';
import { cn } from '@/utils/cn';
import type { TimeseriesPoint } from '@/types';

// ─── Tooltip style ────────────────────────────────────────────────────────────

const TT = {
  contentStyle: {
    background: '#111827',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    fontSize: '12px',
  },
  labelStyle: { color: '#9ca3af', fontSize: '11px', marginBottom: '2px' },
  itemStyle: { color: '#e5e7eb' },
};

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportCsv(points: TimeseriesPoint[], filename: string) {
  const header = 'date,valeur\n';
  const rows = points.map((p) => `${p.ts},${p.value}`).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────

function ChartCard({
  title,
  children,
  onExport,
}: {
  title: string;
  children: React.ReactNode;
  onExport?: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-gray-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</p>
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-colors"
          >
            <Download size={11} /> CSV
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Fill area chart ──────────────────────────────────────────────────────────

function FillAreaChart({
  data,
  granularity,
}: {
  data: TimeseriesPoint[];
  granularity: 'hour' | 'day';
}) {
  const formatted = data.map((p) => ({
    ...p,
    label: format(new Date(p.ts), granularity === 'hour' ? 'HH:mm' : 'dd/MM', { locale: fr }),
  }));

  if (data.length === 0)
    return <div className="flex h-48 items-center justify-center text-xs text-gray-700">Aucune donnée</div>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formatted}>
        <defs>
          <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={36} />
        <Tooltip {...TT} formatter={((v: number) => [`${v.toFixed(1)}%`, 'Remplissage moyen']) as any} />
        <Area type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2} fill="url(#fillGrad)" dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Report count bar chart ───────────────────────────────────────────────────

function ReportBarChart({
  data,
  granularity,
}: {
  data: TimeseriesPoint[];
  granularity: 'hour' | 'day';
}) {
  const formatted = data.map((p) => ({
    ...p,
    label: format(new Date(p.ts), granularity === 'hour' ? 'HH:mm' : 'dd/MM', { locale: fr }),
  }));

  if (data.length === 0)
    return <div className="flex h-48 items-center justify-center text-xs text-gray-700">Aucune donnée</div>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
        <Tooltip {...TT} formatter={((v: number) => [v, 'Signalements']) as any} />
        <Bar dataKey="value" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Prediction card ──────────────────────────────────────────────────────────

function PredictionCard({ containerId, qrCode }: { containerId: string; qrCode: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['prediction', containerId],
    queryFn: () => analyticsService.getPrediction(containerId),
    staleTime: 5 * 60 * 1000,
  });

  const fillColor = (v: number) =>
    v >= 80 ? '#ef4444' : v >= 60 ? '#f59e0b' : '#22c55e';

  if (isLoading)
    return <div className="h-20 animate-pulse rounded-lg bg-white/5" />;

  if (isError || !data)
    return (
      <div className="rounded-lg border border-white/5 bg-white/2 px-3 py-2 text-xs text-gray-600">
        Prédiction indisponible
      </div>
    );

  return (
    <div className="rounded-lg border border-white/10 bg-gray-800 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-xs font-bold text-gray-300">{qrCode}</span>
        <span className="text-[10px] text-gray-500">Actuel : <span className="font-bold" style={{ color: fillColor(data.current_fill) }}>{data.current_fill}%</span></span>
      </div>
      <div className="flex gap-2">
        {data.predictions.map((p) => (
          <div key={p.horizon_h} className="flex-1 rounded-lg bg-gray-900/80 px-2 py-1.5 text-center">
            <p className="text-[9px] text-gray-600 uppercase tracking-wide">+{p.horizon_h}h</p>
            <p className="mt-0.5 text-base font-black" style={{ color: fillColor(p.predicted_fill) }}>
              {p.predicted_fill.toFixed(0)}%
            </p>
            <p className="text-[9px] text-gray-700">
              [{p.confidence_low.toFixed(0)}–{p.confidence_high.toFixed(0)}]
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Export modal ─────────────────────────────────────────────────────────────

function ExportModal({
  zones,
  onClose,
}: {
  zones: Array<{ id: string; name: string }>;
  onClose: () => void;
}) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [zoneId, setZoneId] = useState('');
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const exportM = useMutation({
    mutationFn: () =>
      analyticsService.exportReports({
        format: exportFormat,
        ...(zoneId ? { zone_id: zoneId } : {}),
        ...(status ? { status } : {}),
        ...(fromDate ? { from_date: fromDate } : {}),
        ...(toDate ? { to_date: toDate } : {}),
      }),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecotrack-reports.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Export téléchargé');
      onClose();
    },
    onError: () => toast.error('Export impossible'),
  });

  const field = 'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-gray-200 outline-none focus:border-teal-500/40';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <FileDown size={14} className="text-teal-400" />
            <h2 className="text-sm font-bold text-white">Exporter les signalements</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Format */}
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Format</label>
            <div className="flex gap-2">
              {(['csv', 'pdf'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setExportFormat(f)}
                  className={`flex-1 rounded-lg border py-2 text-xs font-bold uppercase transition-colors ${
                    exportFormat === f
                      ? 'border-teal-500/40 bg-teal-600/15 text-teal-400'
                      : 'border-white/10 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          {/* Zone */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Zone (optionnel)</label>
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className={field}>
              <option value="">Toutes les zones</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          {/* Status */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Statut (optionnel)</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={field}>
              <option value="">Tous les statuts</option>
              {['OPEN', 'CONFIRMED', 'RESOLVED', 'REJECTED'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Du</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={field} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Au</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={field} />
            </div>
          </div>
          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-gray-400 hover:bg-white/5 transition-colors">Annuler</button>
            <button
              onClick={() => exportM.mutate()}
              disabled={exportM.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              <Download size={13} />
              {exportM.isPending ? 'Export…' : 'Exporter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [zoneFilter, setZoneFilter] = useState('');
  const [granularity, setGranularity] = useState<'hour' | 'day'>('day');
  const [showExport, setShowExport] = useState(false);

  const dateRange = useMemo(() => {
    const to = new Date();
    const from = subDays(to, granularity === 'hour' ? 1 : 7);
    return {
      to: to.toISOString().split('T')[0],
      from: from.toISOString().split('T')[0],
    };
  }, [granularity]);

  const { data: zones = [] } = useQuery({ queryKey: ['zones'], queryFn: zoneService.list });

  const tsParams = {
    granularity,
    ...(zoneFilter ? { zone: zoneFilter } : {}),
    ...dateRange,
  };

  const { data: fillSeries = [] } = useQuery({
    queryKey: ['ts', 'avg_fill', tsParams],
    queryFn: () => analyticsService.getTimeseries({ metric: 'avg_fill', ...tsParams }),
  });

  const { data: reportSeries = [] } = useQuery({
    queryKey: ['ts', 'report_count', tsParams],
    queryFn: () => analyticsService.getTimeseries({ metric: 'report_count', ...tsParams }),
  });

  const { data: topZones = [] } = useQuery({
    queryKey: ['top-zones', 10],
    queryFn: () => analyticsService.getTopZones(10),
  });

  const { data: criticalContainers } = useQuery({
    queryKey: ['containers', { status: 'CRITICAL', limit: 8 }],
    queryFn: () => containerService.list({ status: 'CRITICAL', limit: 8 }),
  });

  const topZonesData = topZones.map((z) => ({
    ...z,
    fill: z.avg_fill_level,
  }));

  return (
    <div className="min-h-full bg-gray-950 p-4 lg:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Analytics</h1>
          <p className="mt-0.5 text-xs text-gray-600">Analyse des métriques opérationnelles</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zone */}
          <div className="relative">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="appearance-none rounded-lg bg-gray-900 border border-white/10 pl-3 pr-8 py-2 text-xs text-gray-300 outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20"
            >
              <option value="">Toutes les zones</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>

          {/* Export */}
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-xs font-semibold text-gray-400 hover:text-gray-200 transition-colors"
          >
            <FileDown size={13} /> Exporter
          </button>

          {/* Granularity */}
          <div className="flex rounded-lg bg-gray-900 border border-white/10 p-0.5">
            {(['day', 'hour'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                  granularity === g ? 'bg-teal-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {g === 'day' ? 'Journalier' : 'Horaire'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 1: fill timeseries */}
      <div className="mb-3">
        <ChartCard
          title={`Remplissage moyen — ${granularity === 'day' ? '7 derniers jours' : '24 dernières heures'}`}
          onExport={() => exportCsv(fillSeries, `fill_${dateRange.from}_${dateRange.to}.csv`)}
        >
          <FillAreaChart data={fillSeries} granularity={granularity} />
        </ChartCard>
      </div>

      {/* Row 2: reports + top zones */}
      <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartCard
          title="Volume de signalements"
          onExport={() => exportCsv(reportSeries, `reports_${dateRange.from}_${dateRange.to}.csv`)}
        >
          <ReportBarChart data={reportSeries} granularity={granularity} />
        </ChartCard>

        <ChartCard title="Top zones — remplissage moyen">
          {topZones.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-xs text-gray-700">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topZonesData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
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
                  width={85}
                />
                <Tooltip {...TT} formatter={((v: number) => [`${v.toFixed(1)}%`, 'Remplissage moyen']) as any} />
                <Bar dataKey="fill" radius={[0, 4, 4, 0]} maxBarSize={16}>
                  {topZonesData.map((z, i) => (
                    <Cell key={i} fill={z.fill >= 80 ? '#ef4444' : z.fill >= 60 ? '#f59e0b' : '#22c55e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Row 3: critical containers predictions */}
      <div className="rounded-xl border border-white/10 bg-gray-900 p-4">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-400" />
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Prédictions — conteneurs critiques
          </p>
          <span className="ml-auto text-[10px] text-gray-600 flex items-center gap-1">
            <TrendingUp size={10} /> Régression linéaire 72h
          </span>
        </div>

        {!criticalContainers || criticalContainers.items.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-gray-700">
            Aucun conteneur critique actuellement
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {criticalContainers.items.map((c) => (
              <PredictionCard key={c.id} containerId={c.id} qrCode={c.qr_code} />
            ))}
          </div>
        )}
      </div>

      {showExport && <ExportModal zones={zones} onClose={() => setShowExport(false)} />}
    </div>
  );
}
