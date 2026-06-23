# ECOTRACK — Plan d'implémentation Backend

**Référence DCT :** ECOTRACK_DCT_V1
**Stack :** FastAPI 0.111 · SQLAlchemy 2.0 async · PostgreSQL 15 + PostGIS · Pydantic v2 · Alembic · paho-mqtt · scikit-learn
**Périmètre :** Bloc 2 (M1) — prototype démontrable en soutenance juin/juillet 2026.

---

## 0. Principes directeurs (non négociables)

- **Une fonctionnalité = une PR**, jamais de big-bang.
- **Pas de logique métier critique côté frontend.** Toute règle (RM-01…RM-06) est appliquée et testée côté backend.
- **Async partout** : `AsyncSession`, `httpx`, `paho-mqtt` thread isolé.
- **RBAC vérifié sur CHAQUE route sensible**, pas seulement via le frontend.
- **Audit log systématique** sur : login (succès et échec), changement rôle, modif conteneur, création signalement, affectation tournée, validation collecte.
- **Aucun secret dans le repo.** `.env` ignoré, `.env.example` à jour.
- **Tests** sur chaque service métier ET sur l'autorisation (citoyen ne peut PAS appeler endpoint manager, etc.).
- **Swagger doit toujours rester à jour** — c'est notre contrat avec l'équipe frontend.

---

## 1. Phases — vue d'ensemble

| Phase | Objectif | Démontre | Critères acceptation DCT |
|------|----------|----------|--------------------------|
| **0** | Fondations (DB, migrations, seeds) | App démarre, DB schema en place | — |
| **1** | Auth + RBAC + audit | Login 4 rôles → JWT, accès filtré | CA-01, F-01, F-02, F-14 |
| **2** | CRUD zones & conteneurs + carte data | Carte affiche conteneurs avec statuts | CA-02, F-03, F-04 |
| **3** | Ingestion IoT + moteur de statut + alertes | Mesure → état conteneur → alerte | CA-04, F-05, F-06 |
| **4** | Signalements + gamification | Citoyen signale → points crédités | CA-03, F-07, F-08, F-11 |
| **5** | Tournées + validation agent | Heuristique → tournée → validation collecte | CA-05, CA-06, F-09, F-10 |
| **6** | Analytics + prédiction ML | Dashboard KPIs + modèle simple | CA-08, F-12 |
| **7** | Admin + audit viewer + exports + finitions | Backoffice, exports CSV/PDF, hardening | CA-07, F-13 |

Chaque phase produit : code livré + tests verts + Swagger à jour + entrée dans le journal de décisions.

---

## 2. Phase 0 — Fondations

### 2.1 État actuel (déjà fait)
- Structure repo `/backend/app/{api,core,db,models,schemas,services,middleware}`.
- 8 modèles SQLAlchemy 2.0 typés (`Mapped[...]`).
- Config Pydantic Settings (`app/core/config.py`).
- Alembic initialisé (`backend/migrations/`, `alembic.ini`).
- DDL SQL brut dans `database/ddl/` (init Docker).
- Seeds zones + users dans `database/seeds/`.
- Docker Compose avec postgres+postgis, redis, mosquitto.

### 2.2 À faire

1. **Générer la 1ʳᵉ migration Alembic** depuis les modèles :
   ```
   cd backend && alembic revision --autogenerate -m "init schema"
   ```
   Vérifier que la migration crée les mêmes tables que `database/ddl/02_schema.sql`. Si divergence → aligner les modèles, pas l'inverse.

2. **Décision : DDL Docker init OU Alembic ?** → garder **Alembic comme source de vérité**. Le DDL initial devient un fallback "démarrage rapide". Documenter dans README que la prod utilise `alembic upgrade head`.

3. **Script `backend/scripts/seed.py`** (remplace les seeds SQL bruts) :
   - Crée les 12 zones (polygones depuis `database/seeds/01_zones.sql`).
   - Crée les 6 users avec **bcrypt réel** (le hash dans le SQL est un placeholder).
   - Génère **100 conteneurs** répartis dans les zones (points aléatoires dans chaque polygone via `ST_GeneratePoints` ou Python `shapely`).
   - Génère **24 h d'historique de mesures** par conteneur (1 mesure / heure, niveau croissant lissé).
   - Idempotent : ne re-crée pas si déjà présent.

4. **`backend/app/main.py`** : ajouter au démarrage un check `SELECT 1` sur la DB pour fail-fast si pas de connexion.

5. **Logging** : configurer `logging` standard avec format JSON (préparation ELK M2). Module `app/core/logging.py`.

### 2.3 Critères de sortie phase 0
- `docker compose up` → API démarre, `/health` répond `{"status":"ok"}`.
- `alembic upgrade head` → schéma complet en DB.
- `python -m scripts.seed` → 12 zones, 6 users, 100 conteneurs, ~2400 mesures.
- `pytest backend/tests/` → 0 test pour l'instant mais collecte sans erreur.

---

## 3. Phase 1 — Auth + RBAC + audit

### 3.1 Modules à créer

| Fichier | Rôle |
|---|---|
| `app/core/security.py` | hash/verify bcrypt, encode/decode JWT |
| `app/schemas/auth.py` | `LoginRequest`, `TokenResponse`, `RegisterRequest` |
| `app/schemas/user.py` | `UserOut`, `UserUpdate` |
| `app/services/auth_service.py` | `authenticate(email,password)`, `create_user(...)` |
| `app/services/audit_service.py` | `log_event(actor_id, action, resource_type, resource_id, ip, details)` |
| `app/api/v1/auth.py` | endpoints |
| `app/api/v1/users.py` | endpoints |
| `app/middleware/auth.py` | `get_current_user`, `require_role(*roles)` |

### 3.2 Endpoints à implémenter

| Méthode | Path | Auth | Body | Réponse | Audit |
|---|---|---|---|---|---|
| POST | `/api/v1/auth/register` | Public (citoyens uniquement) | `{email, password, full_name}` | `UserOut` | `USER_REGISTERED` |
| POST | `/api/v1/auth/login` | Public | `{email, password}` | `{access_token, token_type, user: UserOut}` | `AUTH_LOGIN_SUCCESS` ou `AUTH_LOGIN_FAILED` |
| POST | `/api/v1/auth/refresh` | JWT | — | `TokenResponse` | — |
| GET | `/api/v1/users/me` | JWT | — | `UserOut` | — |
| PATCH | `/api/v1/users/me` | JWT | `{full_name?, password?}` | `UserOut` | `USER_SELF_UPDATED` |

### 3.3 Règles JWT
- Algo `HS256`, secret depuis `settings.SECRET_KEY` (32 chars min, validé au démarrage).
- TTL access token : 60 min.
- Payload : `{"sub": user_id, "role": user_role, "exp": ...}`.
- **Pas de refresh token persistant** en M1 (out of scope) — `/auth/refresh` re-émet un access token si l'existant valide.

### 3.4 RBAC

`app/middleware/auth.py` :
```python
def require_role(*allowed: UserRole):
    def checker(user: User = Depends(get_current_user)):
        if user.role not in allowed:
            raise HTTPException(403, "Forbidden: insufficient role")
        return user
    return checker
```

Usage : `Depends(require_role(UserRole.MANAGER, UserRole.ADMIN))` sur chaque route sensible.

### 3.5 Rate limiting auth
- `slowapi` sur `/auth/login` : **5 tentatives / 5 min / IP**.
- Au-delà → 429 + audit `AUTH_RATE_LIMITED`.

### 3.6 Tests phase 1

| Test | Vérifie |
|---|---|
| `test_login_success` | login valide → 200 + JWT décodable |
| `test_login_wrong_password` | mauvais mdp → 401 + log `AUTH_LOGIN_FAILED` |
| `test_login_unknown_user` | email inconnu → 401 (pas de leak existence compte) |
| `test_register_citizen_ok` | inscription publique → role=CITIZEN forcé |
| `test_register_cannot_self_assign_admin` | tentative `role=ADMIN` → ignorée |
| `test_protected_route_no_token` | sans token → 401 |
| `test_protected_route_bad_role` | citoyen sur route MANAGER → 403 |
| `test_jwt_expired` | token expiré → 401 |
| `test_rate_limit_login` | 6 logins échoués/min → 429 |

### 3.7 Critères de sortie phase 1
- 4 comptes de test (admin/manager/agent/citizen) se connectent.
- Endpoint `/me` retourne le bon profil et le bon rôle.
- Une route protégée refuse les autres rôles.
- Audit log contient les événements auth.

---

## 4. Phase 2 — Zones & conteneurs (CRUD + carte data)

### 4.1 Modules

| Fichier | Rôle |
|---|---|
| `app/schemas/zone.py` | `ZoneOut`, `ZoneCreate`, `ZoneUpdate`, `ZoneStats` |
| `app/schemas/container.py` | `ContainerOut`, `ContainerCreate`, `ContainerUpdate`, `ContainerMapItem` |
| `app/schemas/geo.py` | `GeoPoint`, `GeoPolygon` (helpers conversion WKT ↔ GeoJSON) |
| `app/services/zone_service.py` | CRUD zones + stats |
| `app/services/container_service.py` | CRUD conteneurs + requêtes spatiales |
| `app/api/v1/zones.py` | endpoints |
| `app/api/v1/containers.py` | endpoints |

### 4.2 Endpoints

| Méthode | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/zones` | ANY logged | Liste zones (avec polygone GeoJSON, priorité, count conteneurs) |
| POST | `/api/v1/zones` | ADMIN | Créer une zone |
| PATCH | `/api/v1/zones/{id}` | ADMIN | Modifier |
| GET | `/api/v1/zones/{id}/stats` | MANAGER+ADMIN | KPIs zone (taux moyen, # critiques, # alertes ouvertes) |
| GET | `/api/v1/containers` | ANY logged | Liste paginée + filtres `?zone=&status=&min_fill=&search=` |
| GET | `/api/v1/containers/map` | ANY logged | Vue carte allégée (id, lat, lng, status, fill_level) — pour Leaflet |
| GET | `/api/v1/containers/{id}` | ANY logged | Détail conteneur (dont 24 dernières mesures) |
| POST | `/api/v1/containers` | MANAGER+ADMIN | Créer (auto-assignation à la zone via `ST_Contains`) |
| PATCH | `/api/v1/containers/{id}` | MANAGER+ADMIN | Modifier (audit `CONTAINER_UPDATED`) |
| DELETE | `/api/v1/containers/{id}` | ADMIN | Soft-delete (status=MAINTENANCE) |
| GET | `/api/v1/containers/{id}/measurements` | MANAGER+ADMIN | Historique mesures `?from=&to=` |

### 4.3 PostGIS — requêtes types à implémenter

- **Auto-assignation conteneur → zone** :
  ```sql
  SELECT id FROM zones WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) LIMIT 1
  ```
- **Conteneurs d'une zone** :
  ```sql
  SELECT * FROM containers WHERE zone_id = :zone_id
  ```
- **Conteneurs dans un rayon** (option futur) :
  ```sql
  SELECT * FROM containers WHERE ST_DWithin(geom::geography, ST_MakePoint(:lng, :lat)::geography, :radius_m)
  ```

### 4.4 Format réponse carte (contrat figé pour le frontend)

```json
{
  "items": [
    {
      "id": "uuid",
      "qr_code": "CNT-000001",
      "lat": 48.857,
      "lng": 2.342,
      "status": "CRITICAL",
      "fill_level": 92,
      "last_measured_at": "2026-06-13T08:00:00Z",
      "zone_id": "uuid",
      "zone_name": "Centre-Ville"
    }
  ],
  "total": 100
}
```

### 4.5 Tests phase 2
- CRUD complet conteneur (citoyen ne peut PAS créer).
- Auto-assignation zone via `ST_Contains`.
- Filtres combinés (`?zone=X&status=CRITICAL`).
- Pagination (`limit/offset`, défaut 50, max 500).
- Historique mesures retourné en ordre décroissant.

### 4.6 Critères de sortie
- 100 conteneurs visibles via `GET /containers/map`.
- Les statuts colorimétriques sont cohérents avec RM-01/02/03.
- Frontend peut afficher la carte.

---

## 5. Phase 3 — IoT, moteur de statut & alertes

### 5.1 Modules

| Fichier | Rôle |
|---|---|
| `app/schemas/iot.py` | `MeasurementIn`, `MeasurementOut` |
| `app/schemas/alert.py` | `AlertOut` |
| `app/services/status_engine.py` | calcul statut conteneur depuis mesures + signalements (RM-01/02/03) |
| `app/services/alert_service.py` | création/lookup alertes |
| `app/services/iot_ingest.py` | validation + insertion mesure + recalcul statut + déclenchement alerte |
| `app/iot/mqtt_consumer.py` | listener Mosquitto (tâche background asyncio) |
| `app/api/v1/iot.py` | endpoint fallback HTTP |
| `app/api/v1/alerts.py` | listing alertes |

### 5.2 Moteur de statut (centralisé — `status_engine.py`)

```
compute_status(latest_fill, recent_critical_report: bool, is_disabled: bool) -> ContainerStatus:
    if is_disabled:                                          return MAINTENANCE
    if latest_fill is None:                                  return UNKNOWN
    if latest_fill >= 90 or recent_critical_report:          return CRITICAL
    if latest_fill >= 70:                                    return WATCH
    return NORMAL
```

Appelé **côté backend uniquement**, jamais recalculé côté frontend (cf. Annexe F.1 DCT).

### 5.3 Pipeline d'ingestion mesure

1. Recevoir payload (MQTT ou HTTP).
2. Valider via Pydantic (`fill_level` 0-100, `measured_at` non futur, `container_id` existe).
3. Insérer dans `iot_measurements`.
4. Mettre à jour `containers.fill_level_latest`, `last_measured_at`.
5. Recalculer `containers.status` via `status_engine`.
6. Si nouveau statut = `CRITICAL` et pas d'alerte ouverte → créer alerte.
7. Si nouveau statut redescend ≤ `WATCH` et alerte ouverte → la résoudre.

**Erreurs → logger + drop**, jamais crash du worker.

### 5.4 Alertes — modèle léger

Pas de table `alerts` dédiée en M1 → c'est une **vue dérivée** :
- Un conteneur en `CRITICAL` = alerte active.
- Un signalement `OPEN` = alerte active.

`GET /api/v1/alerts` agrège ces deux sources.

(Si besoin de tracer l'historique → ajouter table `alerts` en phase 7 mais pas obligatoire.)

### 5.5 Endpoints

| Méthode | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/iot/measurements` | Service token (header `X-IoT-Token`) | Fallback HTTP si MQTT down |
| GET | `/api/v1/alerts` | MANAGER+ADMIN | Alertes actives `?zone=&type=` |
| POST | `/api/v1/alerts/{id}/acknowledge` | MANAGER+ADMIN | Marquer traitée (audit) |

### 5.6 MQTT consumer
- Topic : `ecotrack/measurements`
- QoS 1
- Tourne dans un thread paho-mqtt + queue asyncio bridge vers le service `iot_ingest`.
- Démarré au startup FastAPI via `@app.on_event("startup")` (ou lifespan).
- En cas de déconnexion : retry exponentiel, log `MQTT_DISCONNECTED`.

### 5.7 Tests phase 3
- Mesure 50 → status WATCH.
- Mesure 92 → status CRITICAL + alerte ouverte.
- Mesure 92 puis 30 → status WATCH/NORMAL + alerte résolue.
- Mesure `fill_level=150` → 422.
- Mesure sur container inexistant → 404 (HTTP) ou drop+log (MQTT).
- Citoyen NE peut PAS poster sur `/iot/measurements`.

### 5.8 Critères de sortie
- Simulateur publie sur MQTT → mesures visibles en DB en moins de 5s.
- Carte frontend change de couleur quand statut change.
- `GET /alerts` retourne les conteneurs critiques.

---

## 6. Phase 4 — Signalements & gamification

### 6.1 Modules

| Fichier | Rôle |
|---|---|
| `app/schemas/report.py` | `ReportIn`, `ReportOut`, `ReportUpdate` |
| `app/services/report_service.py` | création + anti-doublon (F.3) |
| `app/services/gamification_service.py` | crédit points selon événement |
| `app/api/v1/reports.py` | endpoints |

### 6.2 Anti-doublon (cf. Annexe F.3 du DCT)
- Clé : `(container_id, type, user_id)` dans fenêtre **60 min**.
- Comportement : **refuser** avec message clair (`409 Conflict`, body `{detail: "DUPLICATE_REPORT", existing_id: ...}`).
- Configurable via `settings.REPORT_DUPLICATE_WINDOW_MINUTES`.

### 6.3 Gamification — table de gains

| Action | Points |
|---|---|
| Signalement créé (premier sur ce conteneur dans 24h) | +10 |
| Signalement confirmé par agent (CONFIRMED) | +20 bonus |
| Signalement rejeté (REJECTED) | -5 (jamais en-dessous de 0) |
| Inscription | +5 |

Implémentation : à chaque transition de statut signalement → publier événement → `gamification_service` crédite/débite via `points_events`.

### 6.4 Endpoints

| Méthode | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/reports` | CITIZEN+AGENT | Créer signalement (anti-doublon vérifié) |
| GET | `/api/v1/reports` | MANAGER+ADMIN | Liste paginée + filtres |
| GET | `/api/v1/reports/mine` | CITIZEN | Mes signalements |
| GET | `/api/v1/reports/{id}` | Owner ou MANAGER+ | Détail |
| PATCH | `/api/v1/reports/{id}/status` | MANAGER+ADMIN+AGENT | Changer statut → déclenche gamification |
| GET | `/api/v1/users/me/points` | CITIZEN | Total points + 20 derniers événements |

### 6.5 Tests
- Citoyen crée 2 signalements identiques en 1 min → 2ᵉ refusé.
- Signalement confirmé → +20 points crédités.
- Citoyen ne peut PAS lister tous les signalements.

### 6.6 Critères de sortie
- Parcours citoyen : ouverture app → signalement → vu dans son profil avec points.

---

## 7. Phase 5 — Tournées

### 7.1 Modules

| Fichier | Rôle |
|---|---|
| `app/schemas/route.py` | `RouteIn`, `RouteOut`, `RouteOptimizeRequest`, `RouteStepOut`, `RouteStepValidate` |
| `app/services/route_optimizer.py` | heuristique nearest neighbor + 2-opt (cf. Annexe F.2) |
| `app/services/route_service.py` | création tournée depuis optimisation, gestion cycle de vie |
| `app/api/v1/routes.py` | endpoints |

### 7.2 Algorithme (Annexe F.2 DCT)

```
optimize(zone_id, fill_threshold=70, depot=None) -> ordered_container_ids:
  1. Sélectionner conteneurs de la zone où status IN (CRITICAL, WATCH) AND fill >= threshold
     AND non déjà dans une route active (DRAFT/ASSIGNED/IN_PROGRESS)
  2. Point de départ = depot ou centroïde de la zone
  3. Nearest neighbor sur distance haversine (ou ST_Distance sur geography)
  4. Optionnel : 1 passe 2-opt (paramétrable, désactivable)
  5. Retourner liste ordonnée + distance totale estimée
```

`route_optimizer.py` ne touche pas à la DB → fonction pure prenant des `List[Tuple[uuid, lat, lng]]`. Facilite les tests unitaires.

### 7.3 Endpoints

| Méthode | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/routes/optimize` | MANAGER+ADMIN | Renvoie l'ordre proposé (preview, sans créer la route) |
| POST | `/api/v1/routes` | MANAGER+ADMIN | Créer la route en BDD à partir d'une optimisation (ou ordre custom) |
| GET | `/api/v1/routes` | MANAGER+ADMIN | Liste `?date=&status=&agent=` |
| GET | `/api/v1/routes/mine` | AGENT | Mes tournées du jour |
| GET | `/api/v1/routes/{id}` | Manager OU agent assigné | Détail avec steps ordonnés |
| PATCH | `/api/v1/routes/{id}/assign` | MANAGER+ADMIN | Assigner à un agent |
| PATCH | `/api/v1/routes/{id}/start` | AGENT assigné | Statut → IN_PROGRESS |
| PATCH | `/api/v1/routes/{id}/complete` | AGENT assigné | Statut → DONE (tous steps DONE/SKIPPED) |
| PATCH | `/api/v1/route-steps/{id}/validate` | AGENT assigné | Marquer collectée (audit `COLLECTION_VALIDATED`) |
| PATCH | `/api/v1/route-steps/{id}/issue` | AGENT assigné | Marquer issue + commentaire |

### 7.4 Règle RM-06 (collecte → fill_level)
Quand step validé → injecter mesure simulée `fill_level=5` source=`agent_validation` (laisse l'historique propre, pas de bypass du flux de mesures).

### 7.5 Tests
- Optimisation sur 10 conteneurs → ordre nearest neighbor cohérent.
- Tournée ne peut être assignée qu'à un AGENT.
- Agent ne voit que SES tournées (`/routes/mine`).
- Agent d'une autre tournée → 403 sur `/route-steps/{id}/validate`.
- Step validée → injecte mesure + change statut conteneur.

### 7.6 Critères de sortie
- Workflow complet : gestionnaire crée → agent reçoit → valide → KPI met à jour.

---

## 8. Phase 6 — Analytics & prédiction

### 8.1 Modules

| Fichier | Rôle |
|---|---|
| `app/schemas/analytics.py` | `KpiDashboard`, `TimeseriesPoint`, `HeatmapCell`, `PredictionOut` |
| `app/services/analytics_service.py` | requêtes agrégées SQL |
| `app/services/ml_service.py` | wrapper modèle (charge `data/models/fill_predictor.joblib`) |
| `data/notebooks/01_eda.ipynb` | exploration |
| `data/notebooks/02_train_fill_predictor.ipynb` | entraînement |
| `data/scripts/train.py` | script reproductible → produit le `.joblib` |
| `app/api/v1/analytics.py` | endpoints |

### 8.2 KPIs `/api/v1/analytics/kpis`

```json
{
  "containers_total":      100,
  "containers_critical":   12,
  "containers_watch":      28,
  "containers_normal":     58,
  "containers_unknown":    2,
  "alerts_open":           14,
  "reports_open":          6,
  "reports_resolved_7d":   23,
  "routes_active":         3,
  "routes_completed_7d":   18,
  "avg_fill_level":        54.3,
  "co2_estimated_kg_7d":   142.0
}
```

CO₂ : formule simple `distance_km * 0.8 kg/km` documentée dans le DCT.

### 8.3 Endpoints

| Méthode | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/analytics/kpis` | MANAGER+ADMIN | KPIs dashboard |
| GET | `/api/v1/analytics/timeseries` | MANAGER+ADMIN | `?metric=avg_fill&zone=&from=&to=&granularity=hour\|day` |
| GET | `/api/v1/analytics/zones/top` | MANAGER+ADMIN | Top zones par alertes/critiques |
| GET | `/api/v1/analytics/heatmap` | MANAGER+ADMIN | Grille agrégée des signalements |
| GET | `/api/v1/analytics/predictions/containers/{id}` | MANAGER+ADMIN | Niveau prédit à H+24, H+48 |
| POST | `/api/v1/analytics/reports/export` | MANAGER+ADMIN | Génère PDF/CSV (phase 7) |

### 8.4 Modèle ML
- Cible : `fill_level` à H+24.
- Features : `hour_of_day`, `day_of_week`, `zone_priority`, `type`, `fill_level_now`, `slope_last_6h`.
- Modèle : **RandomForestRegressor** (n_estimators=100, max_depth=10) — explicable.
- Métriques attendues notebook : MAE < 12, R² > 0.6 (sur données simulées).
- Sérialisation : `joblib.dump` → `data/models/fill_predictor.joblib`.
- `ml_service` charge le modèle au startup, garde en mémoire.
- Si modèle absent → endpoint retourne `503` avec message clair (pas de crash).

### 8.5 Tests
- KPIs cohérents avec seed.
- Timeseries respecte `granularity`.
- Prédiction retourne value 0-100 + intervalle.

### 8.6 Critères de sortie
- Dashboard frontend affiche les 5+ KPIs.
- Au moins 3 graphiques temporels alimentés.
- Prédiction démontrable sur un conteneur.

---

## 9. Phase 7 — Admin, exports, hardening, finitions

### 9.1 Backoffice admin

| Méthode | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/users` | ADMIN | Liste paginée |
| POST | `/api/v1/users` | ADMIN | Créer (rôles incluant AGENT/MANAGER) |
| PATCH | `/api/v1/users/{id}` | ADMIN | Modifier (audit `USER_ROLE_UPDATED` si role change) |
| DELETE | `/api/v1/users/{id}` | ADMIN | Désactiver (soft) |
| GET | `/api/v1/audit-logs` | ADMIN | Liste paginée `?actor=&action=&from=&to=` |

### 9.2 Exports
- `POST /api/v1/analytics/reports/export` body `{type: "monthly_kpis", format: "pdf"|"csv", from, to}`.
- PDF via `reportlab` ou `weasyprint` (template Jinja2). CSV via `pandas.to_csv`.
- Téléchargement direct (FastAPI `StreamingResponse`).

### 9.3 Hardening
- CORS : whitelist explicite depuis `settings.BACKEND_CORS_ORIGINS`, **pas de `*`** en démo.
- Pas de stack trace dans les 500 (handler global).
- `passlib` rounds=12 (par défaut bcrypt).
- Validation stricte payload Pydantic (`extra="forbid"` sur tous les schémas In).
- SQL : utiliser exclusivement SQLAlchemy ORM/textual avec params (jamais f-string).
- Headers sécurité via middleware (`X-Content-Type-Options`, `X-Frame-Options`, etc.).

### 9.4 Documentation
- Swagger : tags, descriptions, exemples (`example=` dans chaque schéma).
- OpenAPI YAML exporté dans `docs/api/openapi.yaml` (`python -c "from app.main import app; ..."`).
- Mettre à jour `docs/architecture/diagrams.md` avec mermaid.

### 9.5 Tests phase 7
- Admin crée un utilisateur agent → peut se logger.
- Manager ne peut PAS lister users.
- Export CSV renvoie bon Content-Type + lignes attendues.
- Audit log filtré par acteur retourne les bons événements.

---

## 10. Tests & CI

### 10.1 Pyramide de tests
- **Unitaires** (60%) : services purs (`status_engine`, `route_optimizer`, `gamification`).
- **Intégration API** (35%) : FastAPI `TestClient` + DB de test postgresql (fixture `pytest-asyncio`).
- **E2E** (5%) : scénario complet (login manager → optimize → assign → validate). Optionnel mais recommandé.

### 10.2 Fixtures clés (`backend/tests/conftest.py`)
- `db` : nouvelle session par test, rollback fin de test.
- `client` : `httpx.AsyncClient` sur `app`.
- `seed_minimal` : 1 user par rôle, 3 conteneurs, 1 zone.
- `auth_headers(role)` : helper qui logge et retourne `{Authorization: Bearer ...}`.

### 10.3 CI GitHub Actions (déjà scaffold)
- `backend` job : lint (ruff) + tests pytest + coverage report.
- Échoue si coverage < 60% sur `app/services/`.

---

## 11. Traçabilité — couverture exigences DCT

| Exigence | Phase | Endpoint(s) / module |
|---|---|---|
| F-01 Authentification | 1 | `/auth/login`, `/auth/refresh`, JWT |
| F-02 Rôles | 1 | `require_role`, middleware |
| F-03 Conteneurs CRUD | 2 | `/containers` |
| F-04 Carte | 2 | `/containers/map` |
| F-05 Mesures IoT | 3 | MQTT consumer + `/iot/measurements` |
| F-06 Alertes | 3 | `status_engine` + `/alerts` |
| F-07 Signalement | 4 | `/reports` |
| F-08 Anti-doublon | 4 | `report_service` |
| F-09 Tournées | 5 | `/routes/optimize`, `/routes` |
| F-10 Agent validation | 5 | `/route-steps/{id}/validate` |
| F-11 Gamification | 4 | `gamification_service` + `/users/me/points` |
| F-12 Analytics | 6 | `/analytics/*` |
| F-13 Exports | 7 | `/analytics/reports/export` |
| F-14 Journalisation | 1→7 | `audit_service` à chaque action sensible |

---

## 12. Ordre de PR recommandé

1. PR-1 : Phase 0 (migrations + seed script)
2. PR-2 : Phase 1.1 (security.py + JWT + bcrypt + tests)
3. PR-3 : Phase 1.2 (endpoints auth + RBAC + audit)
4. PR-4 : Phase 2.1 (zones CRUD)
5. PR-5 : Phase 2.2 (containers CRUD + map endpoint)
6. PR-6 : Phase 3.1 (status_engine + tests)
7. PR-7 : Phase 3.2 (IoT ingest HTTP + MQTT consumer)
8. PR-8 : Phase 4 (reports + gamification)
9. PR-9 : Phase 5.1 (route_optimizer pure function + tests)
10. PR-10 : Phase 5.2 (routes endpoints + validation agent)
11. PR-11 : Phase 6.1 (analytics KPIs + timeseries)
12. PR-12 : Phase 6.2 (ML training script + predictions endpoint)
13. PR-13 : Phase 7.1 (admin + audit viewer)
14. PR-14 : Phase 7.2 (exports + hardening + final docs)

Chaque PR : ≤ 600 lignes diff, tests verts en CI, swagger à jour.

---

## 13. Checklist de fin de phase (à cocher à chaque phase)

- [ ] Tous les tests phase verts en local et en CI
- [ ] Swagger reflète les nouveaux endpoints
- [ ] Audit log écrit pour les nouvelles actions sensibles
- [ ] RBAC vérifié sur chaque nouvelle route
- [ ] Pas de secret commité
- [ ] README à jour si nouvelle commande ou dépendance
- [ ] Journal de décisions (`docs/architecture/decisions.md`) mis à jour si choix structurant
