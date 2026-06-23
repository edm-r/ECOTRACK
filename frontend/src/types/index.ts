// ─── Utilisateurs ────────────────────────────────────────────────────────────

export type UserRole = 'CITIZEN' | 'AGENT' | 'MANAGER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface UserOut {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  user: UserOut;
}

// ─── Erreurs API (D-08) ───────────────────────────────────────────────────────

export interface ApiErrorDetail {
  loc: string[];
  msg: string;
  type: string;
}

export interface ApiError {
  detail: string | ApiErrorDetail[];
}

// ─── Pagination (D-06) ────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Conteneurs & Zones (Phase 2) ─────────────────────────────────────────────

export type ContainerStatus = 'UNKNOWN' | 'NORMAL' | 'WATCH' | 'CRITICAL' | 'MAINTENANCE';

export interface ContainerMapItem {
  id: string;
  qr_code: string;
  lat: number;
  lng: number;
  status: ContainerStatus;
  fill_level: number | null;
  last_measured_at: string | null;
  zone_id: string;
  zone_name: string;
}

export interface ContainerOut {
  id: string;
  zone_id: string | null;
  zone_name: string | null;
  qr_code: string;
  type: string;
  capacity_l: number;
  lat: number;
  lng: number;
  status: ContainerStatus;
  fill_level_latest: number | null;
  last_measured_at: string | null;
  created_at: string;
}

export interface ZoneOut {
  id: string;
  name: string;
  priority: number;
  geom: GeoJsonGeometry | null;
  created_at: string;
  container_count: number;
}

export interface ZoneStats {
  zone_id: string;
  zone_name: string;
  container_count: number;
  avg_fill_level: number | null;
  critical_count: number;
  watch_count: number;
  normal_count: number;
  unknown_count: number;
  maintenance_count: number;
}

// GeoJSON Polygon/MultiPolygon geometry returned by the backend (zone.geom)
export interface GeoJsonGeometry {
  type: string;
  coordinates: unknown;
}

export interface Measurement {
  id: string;
  container_id: string;
  fill_level: number;
  temperature: number | null;
  battery: number | null;
  source: string;
  measured_at: string;
}

// ─── Signalements (Phase 3) ───────────────────────────────────────────────────

export type ReportType = 'FULL' | 'DAMAGED' | 'BLOCKED' | 'OTHER';
export type ReportStatus = 'OPEN' | 'CONFIRMED' | 'RESOLVED' | 'REJECTED';

export interface ReportOut {
  id: string;
  container_id: string;
  type: ReportType;
  status: ReportStatus;
  comment: string | null;
  created_at: string;
  user_id: string;
}

export interface PointsSummary {
  total_points: number;
  events: Array<{ source: string; points: number; created_at: string }>;
}

// ─── Alertes IoT (Phase 4) ────────────────────────────────────────────────────

export type AlertType = 'CRITICAL_FILL' | 'OPEN_REPORT';

export interface AlertOut {
  id: string;
  type: AlertType;
  container_id: string;
  container_qr: string;
  zone_name: string;
  fill_level: number | null;
  since: string;
  acknowledged: boolean;
}

// ─── Admin (Phase 7) ─────────────────────────────────────────────────────────

export interface AuditLogOut {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

// ─── Analytics (Phase 6) ─────────────────────────────────────────────────────

export interface KpiDashboard {
  containers_total: number;
  containers_critical: number;
  containers_watch: number;
  containers_normal: number;
  containers_unknown: number;
  alerts_open: number;
  reports_open: number;
  reports_resolved_7d: number;
  routes_active: number;
  routes_completed_7d: number;
  avg_fill_level: number;
  co2_estimated_kg_7d: number;
}

export interface TimeseriesPoint {
  ts: string;
  value: number;
}

export interface TopZone {
  zone_id: string;
  zone_name: string;
  container_count: number;
  avg_fill_level: number;
  critical_count: number;
}

export interface ContainerPrediction {
  container_id: string;
  current_fill: number;
  predictions: Array<{
    horizon_h: number;
    predicted_fill: number;
    confidence_low: number;
    confidence_high: number;
  }>;
}

// ─── Tournées (Phase 5) ───────────────────────────────────────────────────────

export type RouteStatus = 'DRAFT' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type StepStatus = 'PENDING' | 'DONE' | 'SKIPPED' | 'ISSUE';

export interface RouteStepOut {
  id: string;
  step_order: number;
  container_id: string;
  qr_code: string;
  lat: number;
  lng: number;
  status: StepStatus;
  collected_at: string | null;
}

export interface RouteOut {
  id: string;
  zone_id: string;
  zone_name: string;
  agent_id: string | null;
  agent_name: string | null;
  scheduled_date: string;
  status: RouteStatus;
  estimated_distance: number | null;
  steps: RouteStepOut[];
}

export interface RouteOptimizeResponse {
  ordered_steps: Array<{
    container_id: string;
    qr_code: string;
    lat: number;
    lng: number;
    fill_level: number;
    status: string;
  }>;
  estimated_distance_km: number;
  container_count: number;
}
