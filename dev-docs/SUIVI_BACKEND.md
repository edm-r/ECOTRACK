# ECOTRACK — Suivi d'avancement Backend

> Source de vérité pour l'agent backend. Mise à jour après chaque correctif ou livraison.  
> Dernière mise à jour : **2026-06-13 — session correctifs P1/P2/P3**

---

## Statut global

| Dimension | État | Dernière action |
|---|---|---|
| Fonctionnel (phases 0→7) | ✅ Complet | Phases 0→7 livrées |
| Tests exécutables | ✅ Débloqué | SEC-4 + BK-2 corrigés 2026-06-13 |
| Sécurité applicative | ✅ Complet | SECRET_KEY validée, CSP+HSTS ajoutés |
| Documentation livrables | ✅ Généré | `docs/api/openapi.yaml` — 38 routes, 49 schemas |
| Qualité dépendances | ✅ Propre | bcrypt direct, greenlet ajouté, pandas/sklearn retirés |
| Schéma DB | ✅ Synchronisé | DDL aligné avec migration Alembic (enums natifs + colonne reason) |

---

## Phases d'implémentation

| Phase | Contenu | Statut | Tests | Notes |
|---|---|---|---|---|
| 0 | Fondations, Alembic, seeds | ✅ | — | |
| 1 | Auth JWT, RBAC, audit | ✅ | ⚠️ | `/auth/refresh` absent |
| 2 | Zones & conteneurs CRUD | ✅ | ⚠️ | Tests non exécutables (SEC-4) |
| 3 | IoT ingest, MQTT, alertes | ✅ | ⚠️ | |
| 4 | Signalements, gamification | ✅ | ⚠️ | |
| 5 | Tournées, optimiseur | ✅ | ⚠️ | Bug `ContainerPoint` import — corrigé 2026-06-13 |
| 6 | Analytics, prédiction ML | ✅ | ⚠️ | |
| 7 | Admin, export CSV/PDF, hardening | ✅ | ⚠️ | |

---

## Correctifs en attente (par priorité)

### 🔴 P1 — Bloquants soutenance

| ID | Description | Fichier(s) concerné(s) | Statut |
|---|---|---|---|
| SEC-4 | `.env` non lu depuis `backend/` (CWD) → tests tombent sur défauts faibles | `app/core/config.py` | ✅ Fait (2026-06-13) |
| BK-2 | `requirements.txt` incomplet — `bcrypt` manquant, `passlib` inutilisé, `greenlet` manquant | `backend/requirements.txt` | ✅ Fait (2026-06-13) |
| BK-1 | `/auth/refresh` absent du plan mais non implémenté — JWT expire sans renouvellement | `app/api/v1/auth.py` | ✅ Fait (2026-06-13) |
| SEC-1 | `SECRET_KEY` défaut accepté sans validation au démarrage | `app/core/config.py` | ✅ Fait (2026-06-13) |
| DB-1 | DDL `database/ddl/02_schema.sql` ≠ migration Alembic : enums vs VARCHAR+CHECK, colonne `reason` absente du DDL | `database/ddl/02_schema.sql` | ✅ Fait (2026-06-13) |
| DOC-1 | `docs/` entièrement vide — OpenAPI non commité, pas de diagramme d'architecture | `docs/api/openapi.yaml` | ✅ Fait (2026-06-13) |
| GIT-1 | Tout le travail sur `phase2`, `main` = commit initial | Git workflow | 🔲 À faire |

### 🟡 P2 — Qualité livrable

| ID | Description | Fichier(s) concerné(s) | Statut |
|---|---|---|---|
| BK-3 | Pas d'artefacts ML : pas de `train.py`, pas de `.joblib`, pas de métriques | `data/notebooks/`, `data/scripts/` | 🔲 À faire |
| SEC-2 | `.env.example` dans `.gitignore` (ne devrait pas l'être) ; valeurs faibles | `.gitignore`, `.env.example` | ✅ Fait (2026-06-13) |
| SEC-3 | `IOT_SERVICE_TOKEN` défaut prévisible | `.env.example` | ✅ Fait (2026-06-13) |
| IOT-1 | Fallback HTTP simulateur jamais appelé (`X-IoT-Token` jamais utilisé) ; simulateur lit la DB directement | `iot-simulator/simulator.py` | 🔲 À faire |
| CI-1 | CI ne tourne pas sur branche `phase2` ; pas de lint ni coverage gate | `.github/workflows/ci.yml` | 🔲 À faire |

### 🟢 P3 — Dette mineure

| ID | Description | Fichier(s) concerné(s) | Statut |
|---|---|---|---|
| BK-4 | `scikit-learn` et `pandas` épinglés mais inutilisés (pivot polyfit) | `requirements.txt` | ✅ Fait (2026-06-13) |
| BK-5 | Pas de `Content-Security-Policy` ni `HSTS` (headers de base présents) | `app/main.py` | ✅ Fait (2026-06-13) |
| B1-3 | Choix polyfit vs RandomForest non documenté dans journal de décisions | `docs/architecture/decisions.md` | 🔲 À faire |

---

## Bugs corrigés (historique)

| Date | ID | Description | Commit/PR |
|---|---|---|---|
| 2026-06-13 | — | `ImportError: cannot import name 'ContainerPoint' from 'app.schemas.route'` — import erroné dans `route_service.py` | fix inline |
| 2026-06-13 | — | Port psycopg2 manquant dans simulateur IoT (`5432` → `5433` depuis host) | fix inline |
| 2026-06-13 | — | `asyncpg array binding` dans `alert_service._acked_ids` — remplacé par set intersection Python | fix inline |
| 2026-06-13 | SEC-4 | `.env` non chargé depuis `backend/` CWD → chemin absolu via `Path(__file__).parents[3]` | `config.py` |
| 2026-06-13 | SEC-1 | `SECRET_KEY` validée au démarrage via `field_validator` (min 32 chars) | `config.py` |
| 2026-06-13 | BK-2 | `passlib[bcrypt]` → `bcrypt==4.1.3` direct ; `greenlet==3.0.3` ajouté ; `pandas`/`scikit-learn` retirés | `requirements.txt` |
| 2026-06-13 | BK-1 | `POST /auth/refresh` implémenté : `create_refresh_token`, `decode_refresh_token`, endpoint + schema | `security.py`, `auth.py`, `auth_service.py` |
| 2026-06-13 | DB-1 | DDL synchronisé avec migration : types ENUM natifs, colonne `reason` dans `points_events` | `database/ddl/02_schema.sql` |
| 2026-06-13 | BK-5 | `Content-Security-Policy` + `HSTS` ajoutés au middleware `add_security_headers` | `main.py` |
| 2026-06-13 | SEC-2 | `.env.example` retiré du `.gitignore`, valeurs remplacées par des exemples forts | `.gitignore`, `.env.example` |
| 2026-06-13 | DOC-1 | `docs/api/openapi.yaml` généré — 38 routes, 49 schemas | `docs/api/openapi.yaml` |

---

## Tests — état détaillé

| Fichier de tests | Nb tests | Tests verts sans DB | Tests verts avec DB | Commentaire |
|---|---|---|---|---|
| `test_phase1_auth.py` | 14 | ~6 (guards/expiré) | 🔴 bloqué SEC-4 | |
| `test_phase2_zones_containers.py` | 14 | 0 | 🔴 bloqué SEC-4 | |
| `test_phase3_iot_alerts.py` | 17 | 6 (status_engine) | 🔴 bloqué SEC-4 | |
| `test_phase4_reports_gamification.py` | 14 | 0 | 🔴 bloqué SEC-4 | |
| `test_phase5_routes.py` | 11 | 5 (optimizer) | 🔴 bloqué SEC-4 | |
| `test_phase6_analytics.py` | 14 | 5 (prediction pure) | 🔴 bloqué SEC-4 | |
| `test_phase7_admin.py` | 12 | 1 (security headers) | 🔴 bloqué SEC-4 | |
| **Total** | **96** | **~23** | **0** | |

> **Cause racine :** `pydantic-settings` cherche `.env` en CWD. Lancé depuis `backend/`, le `.env` est à la racine du projet. Résultat : `POSTGRES_PASSWORD` = `change_me` → `InvalidPasswordError`.
>
> **Fix à appliquer :** dans `config.py`, ajouter `env_file=Path(__file__).parents[2] / ".env"` ou utiliser `env_nested_delimiter`.

---

## Checklist avant soutenance

- [ ] `cd backend && pytest` → **96/96 verts** (SEC-4 corrigé — à valider en venv propre)
- [ ] `cd backend && pytest --cov=app --cov-report=term` → **couverture ≥ 60 % sur `app/services/`**
- [ ] `docker compose up` → tous les services démarrent sans erreur
- [ ] `GET /health` → `{"status": "ok"}`
- [ ] `GET /docs` → Swagger accessible, tous les endpoints documentés
- [x] `python scripts/export_openapi.py` → `docs/api/openapi.yaml` généré ✅
- [x] `/auth/refresh` implémenté ✅
- [x] Validation `SECRET_KEY ≠ défaut` au startup ✅
- [x] `.env.example` commité (retiré de `.gitignore`) ✅
- [ ] `main` = branche de livraison (merge de `phase2`)
