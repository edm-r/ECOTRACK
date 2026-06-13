import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronRight, ChevronLeft, Zap, CheckCircle2,
  Navigation, Map as MapIcon, ClipboardCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { routeService } from '@/services/routes';
import { zoneService } from '@/services/zones';
import { cn } from '@/utils/cn';
import type { RouteOptimizeResponse } from '@/types';

// ─── Stepper ──────────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: 'Configuration', icon: <MapIcon size={14} /> },
  { n: 2, label: 'Itinéraire',    icon: <Navigation size={14} /> },
  { n: 3, label: 'Confirmation',  icon: <ClipboardCheck size={14} /> },
] as const;

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map(({ n, label, icon }, i) => (
        <div key={n} className="flex items-center">
          {i > 0 && (
            <div className={cn('h-px w-10', step > i ? 'bg-teal-500' : 'bg-gray-800')} />
          )}
          <div className={cn('flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all',
            step === n ? 'bg-teal-500/15 text-teal-300' :
            step > n  ? 'text-teal-500/60' : 'text-gray-600'
          )}>
            <div className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
              step === n ? 'bg-teal-500 text-white' :
              step > n  ? 'bg-teal-500/20 text-teal-500' : 'bg-gray-800 text-gray-500'
            )}>
              {step > n ? <CheckCircle2 size={12} /> : n}
            </div>
            <span className="hidden text-xs font-semibold sm:block">{label}</span>
            <span className="sm:hidden">{icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Mini map with polyline ───────────────────────────────────────────────────

function PreviewMap({ preview }: { preview: RouteOptimizeResponse }) {
  const positions = preview.ordered_steps.map((s): [number, number] => [s.lat, s.lng]);
  const center: [number, number] = positions.length > 0
    ? [
        positions.reduce((a, p) => a + p[0], 0) / positions.length,
        positions.reduce((a, p) => a + p[1], 0) / positions.length,
      ]
    : [48.8566, 2.3522];

  const markers = preview.ordered_steps.map((_s, i) =>
    L.divIcon({
      className: '',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      html: `<div style="width:26px;height:26px;border-radius:50%;background:#0d9488;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;">${i + 1}</div>`,
    })
  );

  return (
    <div className="h-70 overflow-hidden rounded-xl border border-white/10">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        <Polyline positions={positions} pathOptions={{ color: '#0d9488', weight: 2, dashArray: '6 4' }} />
        {preview.ordered_steps.map((s, i) => (
          <Marker key={s.container_id} position={[s.lat, s.lng]} icon={markers[i]} />
        ))}
      </MapContainer>
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

interface Config { zone_id: string; date: string; fill_threshold: number }

function Step1({ config, onChange, onNext }: {
  config: Config;
  onChange: (c: Config) => void;
  onNext: () => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const { data: zones } = useQuery({ queryKey: ['zones'], queryFn: zoneService.list });

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold text-white">Configuration</h2>
      <p className="mb-6 text-sm text-gray-500">Paramètres de la tournée à planifier.</p>

      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-400">Zone</label>
          <select
            value={config.zone_id}
            onChange={(e) => onChange({ ...config, zone_id: e.target.value })}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20"
          >
            <option value="">Sélectionner une zone</option>
            {zones?.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-400">Date planifiée</label>
          <input
            type="date"
            min={today}
            value={config.date}
            onChange={(e) => onChange({ ...config, date: e.target.value })}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-400">Seuil de remplissage</label>
            <span className="text-xs font-bold text-teal-400">{config.fill_threshold}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={config.fill_threshold}
            onChange={(e) => onChange({ ...config, fill_threshold: Number(e.target.value) })}
            className="w-full accent-teal-500"
          />
          <div className="mt-1 flex justify-between text-[10px] text-gray-700">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
          <p className="mt-1.5 text-[11px] text-gray-600">
            Seuls les conteneurs ≥ {config.fill_threshold}% seront inclus.
          </p>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!config.zone_id || !config.date}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-40 transition-all"
      >
        Calculer l'itinéraire <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2({ config, onBack, onNext }: {
  config: Config;
  onBack: () => void;
  onNext: (preview: RouteOptimizeResponse) => void;
}) {
  const [preview, setPreview] = useState<RouteOptimizeResponse | null>(null);

  const optimize = useMutation({
    mutationFn: () =>
      routeService.optimize({
        zone_id: config.zone_id,
        fill_threshold: config.fill_threshold,
        date: config.date,
      }),
    onSuccess: (data) => setPreview(data),
    onError: () => toast.error('Impossible de calculer l\'itinéraire'),
  });

  const fillColor = (v: number) => v >= 80 ? '#ef4444' : v >= 60 ? '#f59e0b' : '#22c55e';

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold text-white">Aperçu de l'itinéraire</h2>
      <p className="mb-5 text-sm text-gray-500">
        Ordre optimisé des collectes pour cette zone.
      </p>

      {!preview ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          {optimize.isPending ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
              <p className="text-sm text-gray-500">Calcul en cours…</p>
            </>
          ) : (
            <button
              onClick={() => optimize.mutate()}
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white hover:bg-teal-700 transition-colors"
            >
              <Zap size={16} />
              Calculer l'itinéraire
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/3 border border-white/5 p-4 text-center">
              <p className="text-2xl font-black text-white">{preview.container_count}</p>
              <p className="text-xs text-gray-500 mt-0.5">conteneurs</p>
            </div>
            <div className="rounded-xl bg-white/3 border border-white/5 p-4 text-center">
              <p className="text-2xl font-black text-white">
                {preview.estimated_distance_km.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">km estimés</p>
            </div>
          </div>

          {/* Map */}
          <PreviewMap preview={preview} />

          {/* Steps table */}
          <div className="max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-gray-900">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-2 text-left text-gray-500">N°</th>
                  <th className="px-3 py-2 text-left text-gray-500">QR</th>
                  <th className="px-3 py-2 text-left text-gray-500">Remplissage</th>
                </tr>
              </thead>
              <tbody>
                {preview.ordered_steps.map((s, i) => (
                  <tr key={s.container_id} className="border-b border-white/5">
                    <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                    <td className="px-3 py-2 font-mono text-gray-300">{s.qr_code}</td>
                    <td className="px-3 py-2 font-bold" style={{ color: fillColor(s.fill_level) }}>
                      {s.fill_level}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => onNext(preview)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-bold text-white hover:bg-teal-700 transition-colors"
          >
            Confirmer l'itinéraire <ChevronRight size={16} />
          </button>
        </div>
      )}

      <button
        onClick={onBack}
        className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <ChevronLeft size={12} /> Retour
      </button>
    </div>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

function Step3({ config, preview, onBack }: {
  config: Config;
  preview: RouteOptimizeResponse;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const { data: zones } = useQuery({ queryKey: ['zones'], queryFn: zoneService.list });

  const create = useMutation({
    mutationFn: () =>
      routeService.create({
        zone_id: config.zone_id,
        fill_threshold: config.fill_threshold,
        scheduled_date: config.date,
      }),
    onSuccess: (route) => {
      toast.success('Tournée créée !');
      navigate(`/tours/${route.id}`);
    },
    onError: () => toast.error('Création impossible'),
  });

  const zoneName = zones?.find((z) => z.id === config.zone_id)?.name ?? config.zone_id;

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold text-white">Confirmation</h2>
      <p className="mb-6 text-sm text-gray-500">Vérifiez les détails avant de créer la tournée.</p>

      <div className="rounded-xl bg-white/3 border border-white/5 divide-y divide-white/5">
        {[
          { label: 'Zone', value: zoneName },
          {
            label: 'Date',
            value: format(new Date(config.date), 'EEEE dd MMMM yyyy', { locale: fr }),
          },
          { label: 'Seuil remplissage', value: `≥ ${config.fill_threshold}%` },
          { label: 'Conteneurs', value: `${preview.container_count}` },
          { label: 'Distance estimée', value: `${preview.estimated_distance_km.toFixed(1)} km` },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-gray-500">{label}</span>
            <span className="text-sm font-semibold text-gray-200">{value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => create.mutate()}
        disabled={create.isPending}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-40 shadow-lg shadow-teal-500/20 transition-all"
      >
        {create.isPending ? 'Création…' : 'Créer la tournée'}
      </button>

      <button
        onClick={onBack}
        className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <ChevronLeft size={12} /> Retour
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewTourPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [config, setConfig] = useState<Config>({
    zone_id: '',
    date: new Date().toISOString().split('T')[0],
    fill_threshold: 70,
  });
  const [preview, setPreview] = useState<RouteOptimizeResponse | null>(null);

  return (
    <div className="min-h-full bg-gray-950 p-6">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white tracking-tight">Planifier une tournée</h1>
          <p className="mt-1 text-sm text-gray-500">Optimisation automatique de l'ordre de collecte.</p>
        </div>

        <Stepper step={step} />

        <div className="rounded-2xl bg-gray-900 border border-white/10 p-6 shadow-xl">
          {step === 1 && (
            <Step1
              config={config}
              onChange={setConfig}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <Step2
              config={config}
              onBack={() => setStep(1)}
              onNext={(p) => { setPreview(p); setStep(3); }}
            />
          )}
          {step === 3 && preview && (
            <Step3
              config={config}
              preview={preview}
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
