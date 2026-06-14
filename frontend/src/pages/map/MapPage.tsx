import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, ChevronLeft, ChevronRight, MapPin, Clock, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { containerService } from '@/services/containers';
import { zoneService } from '@/services/zones';
import { STATUS_CONFIG } from '@/utils/status';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import { QueryError } from '@/components/ui/QueryError';
import type { ContainerMapItem, ContainerStatus } from '@/types';

// Fix default Leaflet icon (precaution)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

// ─── Custom divIcon factory ───────────────────────────────────────────────────

function createMarkerIcon(item: ContainerMapItem) {
  const { dot } = STATUS_CONFIG[item.status];
  const fill = item.fill_level !== null ? `${item.fill_level}%` : '?';
  const isCritical = item.status === 'CRITICAL';

  return L.divIcon({
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
    html: `
      <div style="
        width:40px;height:40px;border-radius:50%;
        background:${dot}22;
        border:2.5px solid ${dot};
        display:flex;align-items:center;justify-content:center;
        font-family:monospace;font-size:10px;font-weight:700;
        color:${dot};
        box-shadow: 0 0 ${isCritical ? '12px 4px' : '6px 2px'} ${dot}66;
        ${isCritical ? 'animation:pulse-ring 1.5s ease infinite;' : ''}
      ">${fill}</div>
    `,
  });
}

// ─── Map controller (fly-to) ─────────────────────────────────────────────────

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  if (target) map.flyTo(target, 17, { duration: 0.8 });
  return null;
}

// ─── Viewport bounds tracker (FR-4 clustering workaround) ────────────────────
// Tracks the visible map area so only in-viewport markers are rendered.
// Avoids DOM overload with large container datasets without external deps.

function BoundsTracker({ onChange }: { onChange: (b: L.LatLngBounds) => void }) {
  const map = useMapEvents({
    moveend: () => onChange(map.getBounds()),
    zoomend: () => onChange(map.getBounds()),
  });
  useEffect(() => { onChange(map.getBounds()); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// ─── Popup content ────────────────────────────────────────────────────────────

function ContainerPopup({
  item,
  canSeeDetail,
  canReport,
}: {
  item: ContainerMapItem;
  canSeeDetail: boolean;
  canReport: boolean;
}) {
  const navigate = useNavigate();
  const cfg = STATUS_CONFIG[item.status];
  const fillPct = item.fill_level ?? 0;
  const fillColor =
    fillPct >= 80 ? '#ef4444' : fillPct >= 60 ? '#f59e0b' : '#22c55e';

  return (
    <div className="min-w-[200px] font-sans">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-sm font-bold text-gray-900">{item.qr_code}</span>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-semibold',
            cfg.bgLight,
            cfg.color
          )}
          style={{ background: `${cfg.dot}18` }}
        >
          {cfg.label}
        </span>
      </div>
      <div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
        <MapPin size={11} />
        <span>{item.zone_name}</span>
      </div>
      {item.fill_level !== null && (
        <div className="mb-2">
          <div className="mb-0.5 flex justify-between text-xs text-gray-500">
            <span>Remplissage</span>
            <span className="font-semibold">{item.fill_level}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${item.fill_level}%`, background: fillColor }}
            />
          </div>
        </div>
      )}
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Clock size={11} />
        <span>
          {item.last_measured_at
            ? format(new Date(item.last_measured_at), 'dd MMM, HH:mm', { locale: fr })
            : 'Jamais mesuré'}
        </span>
      </div>
      <div className={cn('mt-3 flex gap-1.5', (canSeeDetail || canReport) ? '' : 'hidden')}>
        {canSeeDetail && (
          <button
            onClick={() => navigate(`/containers/${item.id}`)}
            className="flex-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Voir le détail
          </button>
        )}
        {canReport && (
          <button
            onClick={() => navigate('/reports/new', { state: { container: item } })}
            className="flex-1 rounded-md bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            Signaler
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar panel ────────────────────────────────────────────────────────────

const ALL_STATUSES: ContainerStatus[] = ['NORMAL', 'WATCH', 'CRITICAL', 'MAINTENANCE', 'UNKNOWN'];

interface MapFilters {
  search: string;
  setSearch: (v: string) => void;
  activeStatuses: Set<ContainerStatus>;
  toggleStatus: (s: ContainerStatus) => void;
  selectedZone: string;
  setSelectedZone: (v: string) => void;
}

function SidePanel({
  containers,
  filtered,
  filters,
  isLoading,
  onSelect,
}: {
  containers: ContainerMapItem[];
  filtered: ContainerMapItem[];
  filters: MapFilters;
  isLoading: boolean;
  onSelect: (item: ContainerMapItem) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { search, setSearch, activeStatuses, toggleStatus, selectedZone, setSelectedZone } = filters;

  const { data: zones } = useQuery({ queryKey: ['zones'], queryFn: zoneService.list });

  const countByStatus = useMemo(() => {
    const counts: Partial<Record<ContainerStatus, number>> = {};
    for (const c of containers) counts[c.status] = (counts[c.status] ?? 0) + 1;
    return counts;
  }, [containers]);

  return (
    <div
      className={cn(
        'absolute left-0 top-0 z-[1000] flex h-full flex-col bg-gray-950/95 backdrop-blur-sm border-r border-white/5 transition-all duration-300',
        collapsed ? 'w-10' : 'w-80'
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 border border-white/10 text-gray-400 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {collapsed ? (
        <div className="flex flex-col items-center gap-3 pt-4 px-1">
          <Layers size={16} className="text-emerald-500" />
          <span
            className="text-[10px] font-bold text-gray-500 [writing-mode:vertical-lr] mt-2"
            style={{ writingMode: 'vertical-lr' }}
          >
            {containers.length} conteneurs
          </span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="border-b border-white/5 px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white tracking-wide">Conteneurs</h2>
              <span className="text-xs text-emerald-400 font-mono">{filtered.length}/{containers.length}</span>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-white/5">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher QR code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md bg-white/5 pl-8 pr-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Status filters */}
          <div className="px-3 py-2 border-b border-white/5">
            <div className="flex flex-wrap gap-1">
              {ALL_STATUSES.map((s) => {
                const cfg = STATUS_CONFIG[s];
                const active = activeStatuses.has(s);
                const count = countByStatus[s] ?? 0;
                return (
                  <button
                    key={s}
                    onClick={() => toggleStatus(s)}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all border',
                      active
                        ? `${cfg.color} border-current bg-current/10`
                        : 'text-gray-600 border-gray-700 hover:border-gray-500'
                    )}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: active ? cfg.dot : '#4b5563' }}
                    />
                    {s} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zone select */}
          {zones && zones.length > 0 && (
            <div className="px-3 py-2 border-b border-white/5">
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full rounded-md bg-white/5 px-2 py-1.5 text-xs text-gray-300 outline-none focus:ring-1 focus:ring-emerald-500/50"
              >
                <option value="">Toutes les zones</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-20">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-center text-xs text-gray-600">Aucun conteneur</p>
            ) : (
              <ul>
                {filtered.map((c) => {
                  const cfg = STATUS_CONFIG[c.status];
                  const fill = c.fill_level;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => onSelect(c)}
                        className="w-full px-3 py-2.5 text-left hover:bg-white/5 transition-colors border-b border-white/3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full flex-shrink-0"
                              style={{ background: cfg.dot }}
                            />
                            <span className="font-mono text-xs font-bold text-gray-200">
                              {c.qr_code}
                            </span>
                          </div>
                          {fill !== null && (
                            <span
                              className="text-[10px] font-semibold"
                              style={{
                                color:
                                  fill >= 80 ? '#ef4444' : fill >= 60 ? '#f59e0b' : '#22c55e',
                              }}
                            >
                              {fill}%
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 mb-1.5">{c.zone_name}</p>
                        {fill !== null && (
                          <div className="h-1 w-full overflow-hidden rounded-full bg-gray-800">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${fill}%`,
                                background:
                                  fill >= 80 ? '#ef4444' : fill >= 60 ? '#f59e0b' : '#22c55e',
                              }}
                            />
                          </div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="absolute bottom-6 right-3 z-[1000] rounded-xl bg-gray-950/90 backdrop-blur-sm border border-white/5 px-3 py-2.5">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500">
        Statut
      </p>
      {ALL_STATUSES.map((s) => {
        const cfg = STATUS_CONFIG[s];
        return (
          <div key={s} className="flex items-center gap-2 py-0.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: cfg.dot }} />
            <span className="text-[11px] text-gray-400">{cfg.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522]; // Paris fallback

export default function MapPage() {
  const { hasRole } = useAuth();
  const canSeeDetail = hasRole(['MANAGER', 'ADMIN', 'AGENT']);
  const canReport = hasRole(['CITIZEN', 'AGENT']);

  const { data: containers = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['containers-map'],
    queryFn: containerService.getMapItems,
    refetchInterval: 30000,
  });

  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  // ── Filtres (remontés ici pour piloter À LA FOIS la liste et les marqueurs) ──
  const [search, setSearch] = useState('');
  const [activeStatuses, setActiveStatuses] = useState<Set<ContainerStatus>>(new Set());
  const [selectedZone, setSelectedZone] = useState('');

  const toggleStatus = useCallback((s: ContainerStatus) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }, []);

  const filters: MapFilters = {
    search,
    setSearch,
    activeStatuses,
    toggleStatus,
    selectedZone,
    setSelectedZone,
  };

  // UX-05 — le même jeu filtré alimente la liste ET les marqueurs.
  const filtered = useMemo(() => {
    return containers.filter((c) => {
      if (search && !c.qr_code.toLowerCase().includes(search.toLowerCase())) return false;
      if (activeStatuses.size > 0 && !activeStatuses.has(c.status)) return false;
      if (selectedZone && c.zone_id !== selectedZone) return false;
      return true;
    });
  }, [containers, search, activeStatuses, selectedZone]);

  const handleSelect = useCallback((item: ContainerMapItem) => {
    setFlyTarget([item.lat, item.lng]);
    setSelectedId(item.id);
    // UX-06 — ouvrir la popup du marqueur correspondant.
    markerRefs.current[item.id]?.openPopup();
  }, []);

  // Marqueurs limités au viewport (+20%) ET au jeu filtré (UX-05).
  const visibleContainers = useMemo(() => {
    if (!mapBounds) return filtered;
    const padded = mapBounds.pad(0.2);
    return filtered.filter((c) => padded.contains([c.lat, c.lng]));
  }, [filtered, mapBounds]);

  const center = useMemo<[number, number]>(() => {
    if (containers.length === 0) return DEFAULT_CENTER;
    const avgLat = containers.reduce((s, c) => s + c.lat, 0) / containers.length;
    const avgLng = containers.reduce((s, c) => s + c.lng, 0) / containers.length;
    return [avgLat, avgLng];
  }, [containers]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-950">
      {/* CSS for critical pulse */}
      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 6px 2px #ef444466; }
          50% { box-shadow: 0 0 16px 6px #ef444488; }
          100% { box-shadow: 0 0 6px 2px #ef444466; }
        }
        .leaflet-popup-content-wrapper {
          background: #111827 !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
        }
        .leaflet-popup-tip { background: #111827 !important; }
        .leaflet-popup-close-button { color: #6b7280 !important; }
        .leaflet-popup-close-button:hover { color: #d1d5db !important; }
        .leaflet-control-attribution { background: rgba(0,0,0,0.5) !important; color: #4b5563 !important; }
        .leaflet-control-attribution a { color: #6b7280 !important; }
      `}</style>

      {/* Side panel */}
      <SidePanel
        containers={containers}
        filtered={filtered}
        filters={filters}
        isLoading={isLoading}
        onSelect={handleSelect}
      />

      {/* Map */}
      <div className="absolute inset-0">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%', background: '#030712' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            maxZoom={20}
          />
          <FlyTo target={flyTarget} />
          <BoundsTracker onChange={setMapBounds} />
          {visibleContainers.map((item) => (
            <Marker
              key={item.id}
              position={[item.lat, item.lng]}
              icon={createMarkerIcon(item)}
              ref={(marker) => {
                if (marker) {
                  markerRefs.current[item.id] = marker;
                  // UX-06 — si ce marqueur est l'élément sélectionné, ouvrir sa popup.
                  if (selectedId === item.id) marker.openPopup();
                } else {
                  delete markerRefs.current[item.id];
                }
              }}
            >
              <Popup>
                <ContainerPopup item={item} canSeeDetail={canSeeDetail} canReport={canReport} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <Legend />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-gray-950/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-xs text-gray-400">Chargement de la carte…</p>
          </div>
        </div>
      )}

      {/* Error overlay (UX-24) */}
      {isError && !isLoading && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-gray-950/90 backdrop-blur-sm">
          <QueryError
            message="Impossible de charger la carte des conteneurs."
            onRetry={() => refetch()}
          />
        </div>
      )}
    </div>
  );
}
