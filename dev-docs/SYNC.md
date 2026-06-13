# ECOTRACK — Fichier de synchronisation agents

> Ce fichier est la source de vérité partagée entre l'agent Backend et l'agent Frontend.
> **Chaque agent met à jour sa section à la fin de chaque phase.**
> Le frontend ne commence une phase que quand le backend a marqué les endpoints correspondants comme `✅ DISPO`.

---

## Statut global

| Agent | Phase en cours | Dernière phase terminée |
|---|---|---|
| Backend | Phase 7 | Phase 6 ✅ |
| Frontend | Phase 6 (débloqué) | Phase 5 ✅ |

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

**Statut backend :** ✅ Terminé (2026-06-13)  
**Statut frontend :** ✅ Terminé (2026-06-13)

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
**Statut :** ✅ Terminé (2026-06-13)

- [x] `app/schemas/zone.py` — `ZoneOut`, `ZoneCreate`, `ZoneUpdate`, `ZoneStats`
- [x] `app/schemas/container.py` — `ContainerOut`, `ContainerCreate`, `ContainerUpdate`, `ContainerMapItem`, `MeasurementOut`
- [x] `app/services/zone_service.py` — CRUD zones + stats (raw SQL + ST_AsGeoJSON)
- [x] `app/services/container_service.py` — CRUD conteneurs + auto-zone (ST_Contains)
- [x] `GET /api/v1/zones` — liste avec polygones GeoJSON + container_count
- [x] `POST /api/v1/zones` — ADMIN uniquement
- [x] `PATCH /api/v1/zones/{id}` — ADMIN uniquement
- [x] `GET /api/v1/zones/{id}/stats` — MANAGER+ADMIN, agrégats par statut
- [x] `GET /api/v1/containers/map` — contrat Leaflet figé, tous authentifiés
- [x] `GET /api/v1/containers` — liste paginée `{items,total,limit,offset}` + filtres
- [x] `GET /api/v1/containers/{id}` — détail avec lat/lng
- [x] `POST /api/v1/containers` — MANAGER+ADMIN, auto-assignation zone via ST_Contains
- [x] `PATCH /api/v1/containers/{id}` — MANAGER+ADMIN, audit `CONTAINER_UPDATED`
- [x] `DELETE /api/v1/containers/{id}` — ADMIN, soft-delete (status=MAINTENANCE)
- [x] `GET /api/v1/containers/{id}/measurements` — MANAGER+ADMIN, `?from=&to=`
- [x] `tests/test_phase2_zones_containers.py` — 14 tests (RBAC, filtres, pagination, auto-zone)

**Notes d'implémentation pour le frontend :**
- `GET /containers/map` retourne `{items: ContainerMapItem[], total: number}` (pas de `limit/offset`)
- `GET /containers` retourne `{items, total, limit, offset}` — pattern pagination uniforme
- Géométrie zones : GeoJSON `{type: "Polygon", coordinates: [...]}` — prêt pour Leaflet
- `lat`/`lng` sont des `float` (WGS84), pas un objet GeoJSON
- Filtres dispo sur `/containers` : `?zone=<uuid>&status=CRITICAL&min_fill=70&search=CNT-&limit=50&offset=0`
- Soft-delete (DELETE) → le conteneur reste visible avec `status: "MAINTENANCE"`

### Phase 3 — IoT, Statut, Alertes
**Statut :** ✅ Terminé (2026-06-13)

- [x] `app/services/status_engine.py` — `compute_status(fill, report, disabled)` (pure function)
- [x] `app/schemas/iot.py` — `MeasurementIn` (fill 0-100, measured_at non-futur, source)
- [x] `app/schemas/alert.py` — `AlertOut` (id, type, container_id, qr, zone, fill, since, acknowledged)
- [x] `app/services/iot_ingest.py` — validate → insert → update container → recompute status
- [x] `app/services/alert_service.py` — agrège CRITICAL containers + OPEN reports
- [x] `app/iot/mqtt_consumer.py` — paho-mqtt thread + asyncio bridge, QoS 1, retry exponentiel
- [x] `POST /api/v1/iot/measurements` — auth `X-IoT-Token`, 404 container absent, 422 maintenance
- [x] `GET /api/v1/alerts` — MANAGER+ADMIN, `?zone=&type=`, tri chronologique inverse
- [x] `POST /api/v1/alerts/{id}/acknowledge` — MANAGER+ADMIN, audit log `ALERT_ACKNOWLEDGED`
- [x] MQTT consumer démarré dans lifespan (échec non-bloquant si broker absent)
- [x] `app/core/config.py` — `IOT_SERVICE_TOKEN` ajouté
- [x] `tests/conftest.py` + `pytest.ini` — fixtures `client` + `db`
- [x] `tests/test_phase3_iot_alerts.py` — 17 tests (status engine ×6, IoT ×8, alertes ×3)

**Notes d'implémentation pour le frontend :**
- `POST /iot/measurements` requiert le header `X-IoT-Token: <token>` (pas de JWT)
- `GET /alerts` retourne `AlertOut[]` trié par `since` DESC (plus récent en premier)
- Pour `POST /alerts/{id}/acknowledge` : `id` = `container_id` (CRITICAL_FILL) ou `report_id` (OPEN_REPORT)
- `acknowledged: true` persiste en base (audit_log) — se remet à `false` si le conteneur redevient CRITICAL après une nouvelle mesure
- Token IoT par défaut en dev : `dev-iot-token-change-in-production` (surcharger via `IOT_SERVICE_TOKEN` dans .env)

### Phase 4 — Signalements & Gamification
**Statut :** ✅ Terminé (2026-06-13)

- [x] `app/schemas/report.py` — `ReportIn`, `ReportOut`, `ReportStatusUpdate`
- [x] `app/services/gamification_service.py` — `award_points()`, table de gains (`REPORT_CREATED` +10, `REPORT_CONFIRMED` +5)
- [x] `app/services/report_service.py` — create, list, list_mine, change_status + `DuplicateReportError`
- [x] Anti-doublon : même user + même container + statut OPEN dans fenêtre 60 min → 409 `{detail: "DUPLICATE_REPORT", existing_id}`
- [x] Transitions de statut validées : OPEN→CONFIRMED|REJECTED, CONFIRMED→RESOLVED|REJECTED
- [x] Création signalement → re-calcule statut container via `status_engine` (open report → CRITICAL)
- [x] Résolution/rejet → re-calcule statut sans le rapport
- [x] Fix `PointsEvent` model — ajout champ `reason` (présent en DB mais absent du modèle ORM)
- [x] `POST /api/v1/reports` — CITIZEN + AGENT uniquement
- [x] `GET /api/v1/reports` — MANAGER+ paginé `{items, total, limit, offset}`, `?zone=&status=`
- [x] `GET /api/v1/reports/mine` — tout utilisateur authentifié
- [x] `PATCH /api/v1/reports/{id}/status` — AGENT+MANAGER+ADMIN
- [x] `tests/test_phase4_reports_gamification.py` — 14 tests (RBAC, doublon, points, transitions)

**Notes d'implémentation pour le frontend :**
- `POST /reports` retourne `ReportOut` directement (pas un objet enveloppé)
- 409 body : `{ detail: { detail: "DUPLICATE_REPORT", existing_id: "<uuid>" } }`
- `GET /reports/mine` et `GET /reports` retournent `{items: ReportOut[], total, limit, offset}`
- Transition invalide → `422` avec message explicite
- `GET /users/me/points` : champ `total_points` (pas `total`) — inchangé depuis Phase 1

### Phase 5 — Tournées
**Statut :** ✅ Terminé (2026-06-13)

- [x] `app/services/route_optimizer.py` — `haversine`, nearest-neighbor + 2-opt, `optimize()` pure function
- [x] `app/schemas/route.py` — `RouteCreate`, `RouteOptimizeRequest/Response`, `RouteOut`, `RouteStepOut`
- [x] `app/services/route_service.py` — CRUD + assign/start/complete + validate_step/issue_step
- [x] `POST /api/v1/routes/optimize` — MANAGER+, preview sans créer
- [x] `POST /api/v1/routes` — MANAGER+, crée tournée + steps optimisés
- [x] `GET /api/v1/routes` — MANAGER+, paginé `{items, total, limit, offset}`
- [x] `GET /api/v1/routes/mine` — AGENT, tournées du jour
- [x] `GET /api/v1/routes/{id}` — MANAGER+ ou AGENT assigné
- [x] `PATCH /api/v1/routes/{id}/assign` — MANAGER+, `?agent_id=<uuid>`
- [x] `PATCH /api/v1/routes/{id}/start` — AGENT assigné → IN_PROGRESS
- [x] `PATCH /api/v1/routes/{id}/complete` — AGENT assigné → DONE
- [x] `PATCH /api/v1/route-steps/{id}/validate` — AGENT, PENDING → DONE
- [x] `PATCH /api/v1/route-steps/{id}/issue` — AGENT, PENDING → ISSUE
- [x] RM-06 : step validée → `ingest_measurement(fill=5, source="route_validation")`
- [x] `tests/test_phase5_routes.py` — 11 tests (optimizer ×5, routes ×6)

**Notes d'implémentation pour le frontend :**
- Steps exposés sous `/route-steps/{id}/validate|issue` (pas `/routes/steps/`)
- `POST /routes/optimize` et `POST /routes` acceptent le même body : `{zone_id, fill_threshold?, scheduled_date?}`
- `PATCH /routes/{id}/assign` reçoit `agent_id` en query param : `?agent_id=<uuid>`
- `estimated_distance` est en km (float), peut être null si zone vide
- Cycle de vie route : DRAFT → ASSIGNED → IN_PROGRESS → DONE

### Phase 6 — Analytics & ML
**Statut :** ✅ Terminé (2026-06-13)

- [x] `app/schemas/analytics.py` — `KpiDashboard`, `TimeseriesResponse`, `TopZonesResponse`, `HeatmapResponse`, `PredictionResponse`
- [x] `app/services/analytics_service.py` — KPIs SQL agrégés, timeseries DATE_TRUNC, top zones, heatmap signalements
- [x] `app/services/prediction_service.py` — régression linéaire numpy (polyfit deg=1) sur 72h d'historique, intervalles de confiance ±2σ
- [x] `GET /api/v1/analytics/kpis` — MANAGER+, 12 métriques dashboard
- [x] `GET /api/v1/analytics/timeseries` — MANAGER+, `?metric=avg_fill|report_count&zone=&from=&to=&granularity=hour|day`
- [x] `GET /api/v1/analytics/zones/top` — MANAGER+, `?limit=5`
- [x] `GET /api/v1/analytics/heatmap` — MANAGER+, `?zone=&days=30`
- [x] `GET /api/v1/analytics/predictions/containers/{id}` — MANAGER+, horizons 24h et 48h
- [x] `tests/test_phase6_analytics.py` — 14 tests (prediction pure ×5, KPIs ×3, timeseries ×3, top zones, heatmap, prédiction endpoint)

**Notes d'implémentation pour le frontend :**
- `KpiDashboard.alerts_open` = CRITICAL containers + OPEN reports (deux sources agrégées)
- `co2_estimated_kg_7d` = `SUM(estimated_distance km) * 0.12` pour routes DONE dans les 7 derniers jours
- Timeseries `from`/`to` : alias de query param (FastAPI `alias="from"`) — utiliser `?from=2026-06-01&to=2026-06-13`
- Prédiction : régression linéaire sur les mesures disponibles — fallback ±10 si < 2 points
- `confidence_low` et `confidence_high` toujours dans [0, 100]

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

- [x] Dépendances installées (TanStack Query v5, Zustand v5, Leaflet, Recharts, RHF v7, Zod v4…)
- [x] Tailwind v4 configuré via `@tailwindcss/vite` (pas de `tailwind.config.js`) + couleurs `status-*` dans `@theme {}` de `index.css`
- [x] Prettier + `prettier-plugin-tailwindcss` configurés (`.prettierrc`)
- [x] Scripts `typecheck`, `lint`, `gen:types` dans `package.json`
- [x] `src/lib/axios.ts` — instance + intercepteurs JWT (request), 401→logout+redirect, 403→toast, 5xx→toast (response)
- [x] `src/utils/cn.ts` — helper clsx + tailwind-merge
- [ ] Husky + lint-staged (reporté — non bloquant pour la démo)

### Phase 1 — Auth & Layout
**Statut :** ✅ TERMINÉ (2026-06-13)

- [x] `src/types/index.ts` — `UserOut`, `TokenResponse`, `PaginatedResponse`, `ApiError`
- [x] `src/services/auth.ts` — `login`, `register`, `getMe`, `updateMe`, `getMyPoints`
- [x] `src/store/auth.ts` — Zustand `persist` (clé `ecotrack-auth`, `partialize: token+user`)
- [x] `src/hooks/useAuth.ts` — `{ user, token, isAuthenticated, hasRole, login, logout }`
- [x] `ProtectedRoute` — redirige `/login` si non-auth, page 403 inline si rôle insuffisant
- [x] `AppShell` + `Sidebar` filtrée par rôle + drawer mobile (hamburger)
- [x] Pages `Login` (split-screen sombre, comptes démo collapsible, gestion 401/429) + `Register` (gestion 409)
- [x] Router complet — toutes les routes déclarées avec placeholders pour phases futures
- [x] `App.tsx` — `useAuthStore.persist.hasHydrated()` (fix bug loader infini) + revalidation token `getMe()` au démarrage
- [x] `main.tsx` — `QueryClientProvider` + `BrowserRouter` + `Toaster` (sonner) + `ReactQueryDevtools`
- [x] `npm run build` → 0 erreur TypeScript

**Fix appliqué :** `isHydrated` retiré du store Zustand — `onRehydrateStorage` s'exécute pendant `create()` (localStorage synchrone) avant que `useAuthStore` soit assigné, causant un loader infini. Remplacé par `useAuthStore.persist.hasHydrated()` + `onFinishHydration` dans `App.tsx`.

### Phase 2 — Carte & Conteneurs
**Statut :** ✅ TERMINÉ (2026-06-13)

- [x] `src/types/index.ts` — `ContainerMapItem`, `ContainerOut`, `ZoneOut`, `ZoneStats`, `Measurement`, `ContainerStatus`
- [x] `src/services/containers.ts` — `getMapItems`, `list`, `getById`, `getMeasurements`, `create`, `update`, `delete`
- [x] `src/services/zones.ts` — `list`, `getStats`
- [x] `src/utils/status.ts` — `STATUS_CONFIG` (label, couleurs Tailwind, hex dot, border)
- [x] `MapPage` — Leaflet CartoDB Dark Matter, marqueurs `L.divIcon` colorés par statut + fill%, popup détail, panneau latéral filtrable (QR, statut, zone), légende, polling 30s
- [x] `ContainersPage` — tableau paginé, filtres (recherche/zone/statut), modal create/edit RHF+Zod, confirm delete, RBAC MANAGER+/ADMIN
- [x] `ContainerDetailPage` — KPI cards (statut, gauge SVG fill, dernière mesure), onglets Infos/Mesures, LineChart Recharts 30 dernières mesures
- [x] Router : `/map` (tous rôles), `/containers` (MANAGER+), `/containers/:id` (MANAGER+, AGENT)
- [x] `npm run build` → 0 erreur TypeScript

**Fix appliqué :** `GET /containers/map` retourne `{items: [...]}` au lieu d'un tableau plat — `getMapItems` normalise les deux formats.

### Phase 3 — Signalements & Gamification
**Statut :** ✅ TERMINÉ (2026-06-13)

- [x] `src/types/index.ts` — `ReportType`, `ReportStatus`, `ReportOut`, `PointsSummary` (champ `total_points` ≠ `total`)
- [x] `src/services/reports.ts` — `create`, `listMine`, `listAll`, `updateStatus`
- [x] `src/services/auth.ts` — ajout `getMyPoints`
- [x] `NewReportPage` — stepper 2 étapes (sélection conteneur → type + commentaire), gestion `409 DUPLICATE_REPORT`, navigate `/map` post-submit
- [x] `ProfilePage` — avatar initiales, compteur `total_points`, timeline événements points, liste signalements avec statuts
- [x] `ReportsPage` — tableau paginé, tabs statut (OPEN/CONFIRMED/RESOLVED/REJECTED/Tous), changement statut inline via select+mutation
- [x] Router : `/reports/new` (CITIZEN, AGENT), `/reports` (MANAGER+), `/profile` (CITIZEN)
- [x] `npm run build` → 0 erreur TypeScript

**Note contrat :** `GET /users/me/points` retourne `{ total_points, events }` — type `PointsSummary` aligné en conséquence.

### Phase 4 — IoT & Alertes
**Statut :** ✅ TERMINÉ (2026-06-13)

- [x] `src/types/index.ts` — `AlertType`, `AlertOut`
- [x] `src/services/alerts.ts` — `list` (normalise tableau / `{items}`), `acknowledge`
- [x] `AlertsBell` + `AlertsPanel` — cloche topbar avec badge rouge (count non-acquittées), dropdown 380px, tri actives/acquittées, acquittement par mutation, polling 30s, fermeture clic extérieur
- [x] `AppShell` — `<Bell>` remplacée par `<AlertsBell>` (cloche simple si non-MANAGER, badge+panel si MANAGER+)
- [x] `npm run build` → 0 erreur TypeScript

### Phase 5 — Tournées
**Statut :** ✅ TERMINÉ (2026-06-13)

- [x] `src/types/index.ts` — `RouteStatus`, `StepStatus`, `RouteStepOut`, `RouteOut`, `RouteOptimizeResponse`
- [x] `src/services/routes.ts` — `optimize`, `create`, `list`, `listMine`, `getById`, `assign`, `start`, `complete`, `validateStep`, `issueStep`
- [x] `ToursPage` — tableau paginé, tabs statut (DRAFT/ASSIGNED/IN_PROGRESS/DONE/CANCELLED/Tous), filtre zone, badge statut animé (pulsing dot IN_PROGRESS), modal "Assigner" UUID, navigation vers détail
- [x] `NewTourPage` — wizard 3 étapes : Config (zone/date/seuil fill slider) → Aperçu (POST /optimize, carte Leaflet mini + polyline numérotée, table étapes) → Confirmation (récap + POST /routes → navigate /tours/:id)
- [x] `TourDetailPage` — layout 2 colonnes : carte Leaflet (markers colorés par step status + polyline) | liste étapes (boutons "Collecté"/"Problème" PENDING), barre progression IN_PROGRESS, boutons Démarrer/Terminer agent, modal Assigner MANAGER, polling 10s si IN_PROGRESS
- [x] `MyToursPage` — fond clair (agent terrain), bouton "Démarrer" si ASSIGNED, cards étapes touch-target ≥48px, boutons "Collecté" (vert) / "Problème" (amber), compteur progression, polling 10s si IN_PROGRESS, liste tournées DONE du jour
- [x] Router : `/tours` (MANAGER/ADMIN), `/tours/new` (MANAGER/ADMIN), `/tours/:id` (MANAGER/ADMIN/AGENT), `/my-tours` (AGENT) — 4 placeholders remplacés
- [x] `npm run build` → 0 erreur TypeScript

### Phase 6 — Dashboard & Analytics
**Statut :** 🔲 En attente Phase 6 backend ✅

- [ ] Types `KpiDashboard`, `TimeseriesPoint`, `ContainerPrediction`
- [ ] `src/services/analytics.ts`
- [ ] `DashboardPage` — KPI cards + line chart fill 7j + pie statuts, polling 30s
- [ ] `AnalyticsPage` — 5 graphiques, filtres zone/date, export CSV/PDF

### Phase 7 — Admin & Polish
**Statut :** 🔲 En attente Phase 7 backend ✅

- [ ] `UsersAdminPage` — CRUD complet, changement rôle, désactivation
- [ ] `AuditLogsPage` — filtres actor/action/date
- [ ] Modal export (CSV/PDF)
- [ ] Error boundary global
- [ ] Responsive check (375px / 768px / 1280px)
- [ ] `npm run build` final sans warning
