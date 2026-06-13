# ECOTRACK — Fichier de synchronisation agents

> Ce fichier est la source de vérité partagée entre l'agent Backend et l'agent Frontend.
> **Chaque agent met à jour sa section à la fin de chaque phase.**
> Le frontend ne commence une phase que quand le backend a marqué les endpoints correspondants comme `✅ DISPO`.

---

## Statut global

| Agent | Phase en cours | Dernière phase terminée |
|---|---|---|
| Backend | Phase 2 | Phase 1 ✅ |
| Frontend | Phase 1 (débloqué) | Phase 0 ✅ |

---

## Règle de synchronisation

```
Backend termine Phase N → met à jour SYNC.md → Frontend peut démarrer Phase N
```

Exception : Frontend Phase 0 (setup tooling) peut se faire en parallèle du Backend Phase 0, sans dépendance API.

---

## Contrats d'API par phase

### Phase 1 — Auth & RBAC

**Statut backend :** ✅ Terminé  
**Statut frontend :** 🔄 Débloqué — peut commencer

| Méthode | Endpoint | Corps | Réponse |
|---|---|---|---|
| POST | `/api/v1/auth/register` | `{email, password, full_name}` | `UserOut` |
| POST | `/api/v1/auth/login` | `{email, password}` | `{access_token, token_type, user: UserOut}` |
| POST | `/api/v1/auth/refresh` | — (Bearer JWT) | `{access_token, token_type}` |
| GET | `/api/v1/users/me` | — | `UserOut` |
| PATCH | `/api/v1/users/me` | `{full_name?, password?}` | `UserOut` |

**Schémas figés :**

```ts
// UserOut
{
  id: string           // UUID
  email: string
  full_name: string
  role: "CITIZEN" | "AGENT" | "MANAGER" | "ADMIN"
  status: "ACTIVE" | "INACTIVE"
  created_at: string   // ISO 8601
}

// TokenResponse
{
  access_token: string
  token_type: "bearer"
  user: UserOut
}
```

**JWT payload :**
```json
{ "sub": "<user_uuid>", "role": "MANAGER", "exp": 1234567890 }
```

**Codes d'erreur à gérer côté frontend :**
- `401` → credentials invalides ou token expiré
- `403` → rôle insuffisant
- `409` → email déjà utilisé (register)
- `429` → rate limit login (5 tentatives / 5 min / IP)

---

### Phase 2 — Zones & Conteneurs

**Statut backend :** 🔲 Non commencé  
**Statut frontend :** 🔲 En attente

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/api/v1/zones` | Tous | Liste zones + polygone GeoJSON |
| GET | `/api/v1/zones/{id}/stats` | MANAGER+ | Stats zone |
| GET | `/api/v1/containers/map` | Tous | Vue carte allégée |
| GET | `/api/v1/containers` | Tous | Liste paginée + filtres |
| GET | `/api/v1/containers/{id}` | Tous | Détail |
| GET | `/api/v1/containers/{id}/measurements` | MANAGER+ | Historique mesures |
| POST | `/api/v1/containers` | MANAGER+ | Créer |
| PATCH | `/api/v1/containers/{id}` | MANAGER+ | Modifier |
| DELETE | `/api/v1/containers/{id}` | ADMIN | Soft delete |

**Schéma `ContainerMapItem` (contrat figé pour Leaflet) :**
```ts
{
  id: string
  qr_code: string
  lat: number
  lng: number
  status: "UNKNOWN" | "NORMAL" | "WATCH" | "CRITICAL" | "MAINTENANCE"
  fill_level: number | null   // 0-100
  last_measured_at: string | null
  zone_id: string
  zone_name: string
}
```

**Réponse liste paginée (pattern commun à toutes les listes) :**
```ts
{
  items: T[]
  total: number
  limit: number
  offset: number
}
```

**Filtres query params `/containers` :**
```
?zone=<uuid>&status=CRITICAL&min_fill=70&search=CNT-00&limit=50&offset=0
```

**Couleurs status (Tailwind, côté frontend) :**
```
NORMAL      → green-500
WATCH       → amber-500
CRITICAL    → red-500
MAINTENANCE → gray-500
UNKNOWN     → blue-400
```

---

### Phase 3 — Signalements & Gamification

**Statut backend :** 🔲 Non commencé  
**Statut frontend :** 🔲 En attente

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| POST | `/api/v1/reports` | CITIZEN, AGENT | Créer signalement |
| GET | `/api/v1/reports` | MANAGER+ | Liste globale |
| GET | `/api/v1/reports/mine` | CITIZEN | Mes signalements |
| PATCH | `/api/v1/reports/{id}/status` | MANAGER+, AGENT | Changer statut |
| GET | `/api/v1/users/me/points` | CITIZEN | Total + historique |

**Schémas :**
```ts
// ReportIn
{
  container_id: string
  type: "FULL" | "DAMAGED" | "BLOCKED" | "OTHER"
  comment?: string
}

// ReportOut
{
  id: string
  container_id: string
  type: "FULL" | "DAMAGED" | "BLOCKED" | "OTHER"
  status: "OPEN" | "CONFIRMED" | "RESOLVED" | "REJECTED"
  comment: string | null
  created_at: string
  user_id: string
}

// PointsSummary
{
  total: number
  events: Array<{ source: string; points: number; created_at: string }>
}
```

**Anti-doublon :** `409 Conflict` avec body `{ detail: "DUPLICATE_REPORT", existing_id: "<uuid>" }`

---

### Phase 4 — IoT & Alertes

**Statut backend :** 🔲 Non commencé  
**Statut frontend :** 🔲 En attente

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/api/v1/alerts` | MANAGER+ | Alertes actives |
| POST | `/api/v1/alerts/{id}/acknowledge` | MANAGER+ | Acquitter |
| POST | `/api/v1/iot/measurements` | Service token | Fallback HTTP |

**Schéma `AlertOut` :**
```ts
{
  id: string
  type: "CRITICAL_FILL" | "OPEN_REPORT"
  container_id: string
  container_qr: string
  zone_name: string
  fill_level: number | null
  since: string    // ISO 8601
  acknowledged: boolean
}
```

**Stratégie polling frontend :**
- Carte gestionnaire : `refetchInterval: 15000`
- Dashboard KPIs : `refetchInterval: 30000`
- Vue agent tournée active : `refetchInterval: 10000`

---

### Phase 5 — Tournées

**Statut backend :** 🔲 Non commencé  
**Statut frontend :** 🔲 En attente

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| POST | `/api/v1/routes/optimize` | MANAGER+ | Preview ordre (sans créer) |
| POST | `/api/v1/routes` | MANAGER+ | Créer tournée |
| GET | `/api/v1/routes` | MANAGER+ | Liste |
| GET | `/api/v1/routes/mine` | AGENT | Mes tournées du jour |
| GET | `/api/v1/routes/{id}` | MANAGER+, AGENT assigné | Détail |
| PATCH | `/api/v1/routes/{id}/assign` | MANAGER+ | Assigner agent |
| PATCH | `/api/v1/routes/{id}/start` | AGENT assigné | → IN_PROGRESS |
| PATCH | `/api/v1/routes/{id}/complete` | AGENT assigné | → DONE |
| PATCH | `/api/v1/route-steps/{id}/validate` | AGENT assigné | Collecte validée |
| PATCH | `/api/v1/route-steps/{id}/issue` | AGENT assigné | Signaler problème |

**Schéma `RouteOptimizeRequest` / `RouteOptimizeResponse` :**
```ts
// Request
{ zone_id: string; fill_threshold?: number; date?: string }

// Response
{
  ordered_steps: Array<{
    container_id: string
    qr_code: string
    lat: number
    lng: number
    fill_level: number
    status: string
  }>
  estimated_distance_km: number
  container_count: number
}
```

**Schéma `RouteOut` :**
```ts
{
  id: string
  zone_id: string
  zone_name: string
  agent_id: string | null
  agent_name: string | null
  scheduled_date: string
  status: "DRAFT" | "ASSIGNED" | "IN_PROGRESS" | "DONE" | "CANCELLED"
  estimated_distance: number | null
  steps: RouteStepOut[]
}

// RouteStepOut
{
  id: string
  step_order: number
  container_id: string
  qr_code: string
  lat: number
  lng: number
  status: "PENDING" | "DONE" | "SKIPPED" | "ISSUE"
  collected_at: string | null
}
```

---

### Phase 6 — Analytics & Prédiction

**Statut backend :** 🔲 Non commencé  
**Statut frontend :** 🔲 En attente

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/api/v1/analytics/kpis` | MANAGER+ | KPIs dashboard |
| GET | `/api/v1/analytics/timeseries` | MANAGER+ | Évolution temporelle |
| GET | `/api/v1/analytics/zones/top` | MANAGER+ | Top zones |
| GET | `/api/v1/analytics/heatmap` | MANAGER+ | Grille signalements |
| GET | `/api/v1/analytics/predictions/containers/{id}` | MANAGER+ | Prédiction ML |

**Schéma `KpiDashboard` (figé) :**
```ts
{
  containers_total: number
  containers_critical: number
  containers_watch: number
  containers_normal: number
  containers_unknown: number
  alerts_open: number
  reports_open: number
  reports_resolved_7d: number
  routes_active: number
  routes_completed_7d: number
  avg_fill_level: number
  co2_estimated_kg_7d: number
}
```

**Query params `/analytics/timeseries` :**
```
?metric=avg_fill&zone=<uuid>&from=2026-06-01&to=2026-06-13&granularity=hour|day
```

**Réponse timeseries :**
```ts
{ points: Array<{ ts: string; value: number }> }
```

**Réponse prédiction :**
```ts
{
  container_id: string
  current_fill: number
  predictions: Array<{
    horizon_h: number    // 24, 48
    predicted_fill: number
    confidence_low: number
    confidence_high: number
  }>
}
```

---

### Phase 7 — Admin & Exports

**Statut backend :** 🔲 Non commencé  
**Statut frontend :** 🔲 En attente

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/api/v1/users` | ADMIN | Liste users |
| POST | `/api/v1/users` | ADMIN | Créer user |
| PATCH | `/api/v1/users/{id}` | ADMIN | Modifier / changer rôle |
| DELETE | `/api/v1/users/{id}` | ADMIN | Désactiver |
| GET | `/api/v1/audit-logs` | ADMIN | Logs `?actor=&action=&from=&to=` |
| POST | `/api/v1/analytics/reports/export` | MANAGER+ | Export CSV/PDF |

---

## Décisions d'architecture partagées

| # | Décision | Raison |
|---|---|---|
| D-01 | JWT uniquement — pas de cookie de session | Simplicité, compatible mobile futur |
| D-02 | Polling côté front (pas de WebSocket en M1) | Complexité backend réduite, suffisant pour la démo |
| D-03 | Statut conteneur calculé 100% backend | Cohérence, une seule source de vérité (status_engine.py) |
| D-04 | Anti-doublon signalement côté backend | Ne pas faire confiance au front pour les règles métier |
| D-05 | `openapi-typescript` génère les types front | Pas de duplication manuelle des schémas |
| D-06 | Réponses listes toujours `{items, total, limit, offset}` | Pattern uniforme, facile à paginer |
| D-07 | UUIDs partout (pas d'entiers auto-incréments) | Sécurité, pas d'IDOR par énumération |
| D-08 | Erreurs API `{detail: string}` ou `{detail: [{loc, msg, type}]}` (Pydantic) | Frontend gère un seul format d'erreur |
| D-09 | Toutes les dates en ISO 8601 UTC | Pas d'ambiguïté timezone |
| D-10 | GeoJSON pour polygones zones, `{lat, lng}` pour points | Leaflet consomme GeoJSON nativement |

---

## Journal de blocages inter-agents

> Utiliser cette section pour signaler un blocage qui nécessite une décision de l'autre agent.

| Date | Agent | Blocage | Résolution |
|---|---|---|---|
| — | — | — | — |

---

## Avancement Backend (mis à jour par l'agent Backend)

### Phase 0 — Fondations
**Statut :** ✅ Terminé

- [x] Migration Alembic générée (`migrations/versions/0001_init_schema.py`)
- [x] Script `seed.py` (zones, users bcrypt réel, 100 conteneurs, ~2400 mesures 24h)
- [x] Health check `/health` opérationnel (+ vérif DB au startup via lifespan)
- [x] Logging JSON configuré (`app/core/logging.py`)

### Phase 1 — Auth & RBAC
**Statut :** ✅ Terminé (2026-06-13)

- [x] `app/core/security.py` — bcrypt hash/verify, JWT encode/decode (HS256)
- [x] `app/schemas/auth.py` — `RegisterRequest`, `LoginRequest`, `TokenResponse`
- [x] `app/schemas/user.py` — `UserOut`, `UserUpdate`
- [x] `app/services/auth_service.py` — `authenticate`, `create_user`, `build_token_response`
- [x] `app/services/audit_service.py` — `log_event` (actor, action, resource, IP, details)
- [x] `app/middleware/auth.py` — `get_current_user`, `require_role(*roles)`
- [x] `POST /api/v1/auth/register` — rôle forcé CITIZEN, 409 si email dupliqué
- [x] `POST /api/v1/auth/login` — rate limit 5/5min/IP (slowapi), audit log
- [x] `GET /api/v1/auth/me` — token requis
- [x] `GET /api/v1/users/me` — profil courant
- [x] `PATCH /api/v1/users/me` — full_name + password
- [x] `GET /api/v1/users/me/points` — total + historique événements
- [x] slowapi 0.1.9 — limiter branché sur `app.state`, handler 429
- [x] `tests/test_phase1_auth.py` — 14 tests (register, login, guards, RBAC, token expiré)

**Notes d'implémentation pour le frontend :**
- Stocker le token JWT dans `localStorage` ou `sessionStorage` (pas de cookie)
- Header attendu : `Authorization: Bearer <token>`
- `POST /register` retourne directement un `TokenResponse` (pas besoin de login séparé)
- `GET /api/v1/users/me/points` retourne `{ total_points: number, events: [...] }` (pas `{ total, events }`)

### Phase 2 — Zones & Conteneurs
**Statut :** 🔲 Non commencé

- [ ] CRUD zones + stats
- [ ] CRUD conteneurs + auto-assignation PostGIS
- [ ] `GET /containers/map` (contrat Leaflet figé)
- [ ] Historique mesures
- [ ] Tests CRUD + filtres + pagination

### Phase 3 — IoT, Statut, Alertes
**Statut :** 🔲 Non commencé

- [ ] `status_engine.py` (RM-01/02/03) testé en isolation
- [ ] Pipeline ingestion (MQTT + fallback HTTP)
- [ ] `GET /alerts`
- [ ] Tests : statut, transitions, alerte déclenchée/résolue

### Phase 4 — Signalements & Gamification
**Statut :** 🔲 Non commencé

- [ ] `POST /reports` + anti-doublon (fenêtre 60 min)
- [ ] `gamification_service` (table de gains)
- [ ] `GET /users/me/points`
- [ ] Tests : doublon, points crédités, accès citoyen

### Phase 5 — Tournées
**Statut :** 🔲 Non commencé

- [ ] `route_optimizer.py` (nearest neighbor + 2-opt) — fonction pure
- [ ] `POST /routes/optimize` (preview)
- [ ] `POST /routes` (créer)
- [ ] Endpoints agent (mine, start, complete, validate step, issue)
- [ ] RM-06 : step validée → mesure fill=5 injectée
- [ ] Tests : optimisation, RBAC agent, validation step

### Phase 6 — Analytics & ML
**Statut :** 🔲 Non commencé

- [ ] KPIs SQL + endpoint
- [ ] Timeseries + top zones + heatmap
- [ ] Notebook entraînement RandomForest
- [ ] Endpoint prédiction
- [ ] Tests : KPIs cohérents avec seed

### Phase 7 — Admin, Exports, Hardening
**Statut :** 🔲 Non commencé

- [ ] CRUD users (admin)
- [ ] `GET /audit-logs`
- [ ] Export CSV/PDF
- [ ] Headers sécurité, CORS whitelist, handler 500 sans stack trace
- [ ] OpenAPI YAML exporté dans `docs/api/openapi.yaml`

---

## Avancement Frontend (mis à jour par l'agent Frontend)

### Phase 0 — Setup
**Statut :** ✅ TERMINÉ (2026-06-13)

- [x] Dépendances installées (TanStack Query, Zustand, Leaflet, Recharts, RHF, Zod…)
- [x] Tailwind v4 configuré via `@tailwindcss/vite` + couleurs status custom dans `index.css`
- [x] Prettier + `prettier-plugin-tailwindcss` configurés (`.prettierrc`)
- [x] Scripts `typecheck`, `lint`, `gen:types` dans `package.json`
- [x] `src/lib/axios.ts` (instance + intercepteurs 401 → logout+redirect, 403 → toast, 5xx → toast)
- [ ] Husky + lint-staged (reporté — non bloquant pour la démo, ajouté en backlog)

### Phase 1 — Auth & Layout
**Statut :** 🔲 En attente Phase 1 backend ✅

- [ ] `AuthStore` Zustand + persistance
- [ ] Pages Login + Register
- [ ] `ProtectedRoute` par rôle
- [ ] `AppShell` + `Sidebar` adapté au rôle
- [ ] Routing complet (toutes les routes déclarées)
- [ ] Redirection post-login par rôle

### Phase 2 — Carte & Conteneurs
**Statut :** 🔲 En attente Phase 2 backend ✅

- [ ] `MapContainer` + `ContainerMarker` coloré + `MapLegend`
- [ ] `ZonePolygon` (toggle)
- [ ] `MapFilters` sidebar
- [ ] Clustering > 200 markers
- [ ] `ContainersList` table paginée
- [ ] `ContainerDetail` + historique line chart

### Phase 3 — Signalement & Profil citoyen
**Statut :** 🔲 En attente Phase 3 backend ✅

- [ ] `ReportForm` (modal FAB)
- [ ] Gestion 409 doublon
- [ ] `CitizenProfile` (points + historique + signalements)
- [ ] `PointsCounter` animation

### Phase 4 — Polling & Alertes
**Statut :** 🔲 En attente Phase 3 backend ✅

- [ ] `refetchInterval` sur carte (15s) et dashboard (30s)
- [ ] `AlertsPanel` avec acquittement
- [ ] Toast sur nouvelles alertes (diff Set IDs)
- [ ] Indicateur "Mis à jour il y a Xs"

### Phase 5 — Tournées
**Statut :** 🔲 En attente Phase 5 backend ✅

- [ ] Wizard `TourCreate` (3 étapes)
- [ ] `RouteMap` avec polyline numérotée
- [ ] `AgentTours` mobile-first
- [ ] `StepList` avec boutons tactiles (≥48px)

### Phase 6 — Dashboard & Analytics
**Statut :** 🔲 En attente Phase 6 backend ✅

- [ ] `KpiCard` × 5+
- [ ] Line chart remplissage 7j
- [ ] Pie chart statuts
- [ ] `AnalyticsPage` (5 charts + export)
- [ ] Widget prédiction

### Phase 7 — Admin & Polish
**Statut :** 🔲 En attente Phase 7 backend ✅

- [ ] `UsersAdmin` CRUD
- [ ] `AuditLogsAdmin` avec filtres
- [ ] Modal export (CSV/PDF)
- [ ] Skeletons, empty states, 404, error boundary
- [ ] Responsive check (375px / 768px / 1280px)
- [ ] `npm run build` sans erreur
