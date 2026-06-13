# ECOTRACK — Suivi d'avancement Backend

> Source de vérité pour l'agent backend. Mise à jour après chaque correctif ou livraison.  
> Dernière mise à jour : **2026-06-13**

---

## Statut global

| Dimension | État | Dernière action |
|---|---|---|
| Fonctionnel (phases 0→7) | ✅ Complet | Phases 0→7 livrées |
| Tests exécutables | 🔴 Bloqué | SEC-4 / BK-2 empêchent le run |
| Sécurité applicative | 🟡 Partiel | SECRET_KEY non validée au démarrage |
| Documentation livrables | 🔴 Vide | `docs/` entièrement vide |
| Qualité dépendances | 🟡 Partiel | Deps incomplètes, deps mortes |
| Schéma DB | 🟡 Dérive | DDL Docker ≠ Alembic |

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
| SEC-4 | `.env` non lu depuis `backend/` (CWD) → tests tombent sur défauts faibles | `app/core/config.py` | 🔲 À faire |
| BK-2 | `requirements.txt` incomplet — `greenlet`, `slowapi`, `shapely`, `python-multipart` non épinglés | `backend/requirements.txt` | 🔲 À faire |
| BK-1 | `/auth/refresh` absent du plan mais non implémenté — JWT expire sans renouvellement | `app/api/v1/auth.py` | 🔲 À faire |
| SEC-1 | `SECRET_KEY` défaut accepté sans validation au démarrage | `app/core/config.py`, `app/main.py` | 🔲 À faire |
| DB-1 | DDL `database/ddl/02_schema.sql` ≠ migration Alembic : enums vs VARCHAR+CHECK, colonne `reason` absente du DDL | `database/ddl/02_schema.sql`, `migrations/0001_init_schema.py` | 🔲 À faire |
| DOC-1 | `docs/` entièrement vide — OpenAPI non commité, pas de diagramme d'architecture | `docs/api/`, `docs/architecture/` | 🔲 À faire |
| GIT-1 | Tout le travail sur `phase2`, `main` = commit initial | Git workflow | 🔲 À faire |

### 🟡 P2 — Qualité livrable

| ID | Description | Fichier(s) concerné(s) | Statut |
|---|---|---|---|
| BK-3 | Pas d'artefacts ML : pas de `train.py`, pas de `.joblib`, pas de métriques | `data/notebooks/`, `data/scripts/` | 🔲 À faire |
| SEC-2 | `.env.example` dans `.gitignore` (ne devrait pas l'être) ; valeurs faibles | `.gitignore`, `.env.example` | 🔲 À faire |
| SEC-3 | `IOT_SERVICE_TOKEN` défaut prévisible | `app/core/config.py` | 🔲 À faire |
| IOT-1 | Fallback HTTP simulateur jamais appelé (`X-IoT-Token` jamais utilisé) ; simulateur lit la DB directement | `iot-simulator/simulator.py` | 🔲 À faire |
| CI-1 | CI ne tourne pas sur branche `phase2` ; pas de lint ni coverage gate | `.github/workflows/ci.yml` | 🔲 À faire |

### 🟢 P3 — Dette mineure

| ID | Description | Fichier(s) concerné(s) | Statut |
|---|---|---|---|
| BK-4 | `scikit-learn` et `pandas` épinglés mais inutilisés (pivot polyfit) | `requirements.txt` | 🔲 À faire |
| BK-5 | Pas de `Content-Security-Policy` ni `HSTS` (headers de base présents) | `app/main.py` | 🔲 À faire |
| B1-3 | Choix polyfit vs RandomForest non documenté dans journal de décisions | `docs/architecture/decisions.md` | 🔲 À faire |

---

## Bugs corrigés (historique)

| Date | ID | Description | Commit/PR |
|---|---|---|---|
| 2026-06-13 | — | `ImportError: cannot import name 'ContainerPoint' from 'app.schemas.route'` — import erroné dans `route_service.py` | fix inline |
| 2026-06-13 | — | Port psycopg2 manquant dans simulateur IoT (`5432` → `5433` depuis host) | fix inline |
| 2026-06-13 | — | `asyncpg array binding` dans `alert_service._acked_ids` — remplacé par set intersection Python | fix inline |

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

- [ ] `cd backend && pytest` → **96/96 verts** (après fix SEC-4 + BK-2)
- [ ] `cd backend && pytest --cov=app --cov-report=term` → **couverture ≥ 60 % sur `app/services/`**
- [ ] `docker compose up` → tous les services démarrent sans erreur
- [ ] `GET /health` → `{"status": "ok"}`
- [ ] `GET /docs` → Swagger accessible, tous les endpoints documentés
- [ ] `python scripts/export_openapi.py` → `docs/api/openapi.yaml` généré et commité
- [ ] `/auth/refresh` implémenté ou retiré du contrat SYNC.md
- [ ] Validation `SECRET_KEY ≠ défaut` au startup
- [ ] `.env.example` commité (retiré de `.gitignore`)
- [ ] `main` = branche de livraison (merge de `phase2`)
