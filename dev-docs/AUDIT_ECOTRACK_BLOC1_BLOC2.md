# ECOTRACK — Rapport d'audit projet (Blocs 1 & 2)

**Date de l'audit :** 13 juin 2026
**Auditeur :** Revue technique automatisée (vérification code vs documentation)
**Périmètre audité :** Bloc 1 (Analyser le besoin et concevoir — RNCP A1) + Bloc 2 (Concevoir et développer la solution logicielle — RNCP A2)
**Hors périmètre (non comptés comme manquements) :** Bloc 3 (infrastructure/sécurité réseau, HA, SIEM, pfSense, IDS) et Bloc 4 (management), reportés au M2.

**Documents de référence :** `ECOTRACK_CDC_COMMUN_V2.md`, `ECOTRACK_DCT_V1.docx.md`, `BACKEND_IMPLEMENTATION_PLAN.md`, `FRONTEND_IMPLEMENTATION_PLAN.md`, `SYNC.md`.

> **Méthode :** chaque affirmation du `SYNC.md` (« phases 0→7 terminées, tests verts, 0 erreur TS ») a été **vérifiée par lecture du code et exécution réelle** (pytest backend, `tsc`/build frontend), et non reprise telle quelle.

---

## 1. Résumé exécutif

Le projet est **réel, substantiel et cohérent** : ce n'est pas une coquille de stubs. Les **14 exigences fonctionnelles (F-01 → F-14)** du DCT sont **fonctionnellement couvertes** côté backend ET frontend, et les 8 critères d'acceptation (CA-01 → CA-08) sont démontrables sur un environnement correctement démarré. Le backend (~16 services, 10 routers, migration PostGIS complète) et le frontend (16 pages, 8 services, build TypeScript vert confirmé) sont de bonne facture.

Les manquements ne portent **pas sur les fonctionnalités** mais sur la **qualité, la preuve et la conception documentée** — exactement les axes qui pèsent en soutenance Blocs 1 & 2 :

| Verdict par axe | Note de maturité | Commentaire |
|---|---|---|
| Fonctionnel (F-01→F-14) | 🟢 9/10 | Tout est implémenté ; seul `/auth/refresh` manque |
| Backend (qualité code) | 🟢 8/10 | Propre, RBAC réel, SQL paramétré ; défauts de secrets & deps |
| Frontend (qualité code) | 🟢 8/10 | Build vert, bonne séparation ; **0 test**, types non générés |
| **Tests & couverture** | 🔴 3/10 | Backend non exécutable en l'état ; frontend **aucun test** |
| **Conception (Bloc 1)** | 🟡 6/10 | DCT riche mais MCD/MLD non « diagrammes », DCT en V0.1 |
| **CI / DevOps démontrable** | 🟡 5/10 | CI réelle mais ni lint ni coverage gate ; `frontend/Dockerfile` manquant |
| **Documentation livrable** | 🔴 3/10 | `docs/` entièrement vide (pas d'OpenAPI commité, pas de diagrammes) |
| **Données / ML (livrables)** | 🟡 5/10 | Prédicteur fonctionnel inline, mais `data/` (notebooks, modèle) vide |
| **Hygiène Git / process** | 🟡 5/10 | Rien n'est mergé sur `main` ; tout vit sur `phase2` |

**Top 5 des manquements à traiter en priorité :**
1. **Aucune preuve de tests exécutables** — backend ne tourne pas hors-config, frontend n'a aucun test. (cf. §9)
2. **`docs/` vide** — aucun livrable de documentation commité (OpenAPI, diagrammes, journal de décisions). (cf. §8.5)
3. **`frontend/Dockerfile` manquant** — le service `frontend` de `docker-compose` ne build pas → démo Docker cassée. (cf. §8.4)
4. **Dérive de schéma DDL ↔ Alembic** — deux définitions divergentes, pas de source de vérité unique. (cf. §8.3)
5. **Secrets par défaut faibles & non validés** + `.env.example` gitignoré. (cf. §10)

---

## 2. Synthèse de conformité aux exigences (DCT §IV)

### 2.1 Exigences fonctionnelles

| # | Exigence | Priorité DCT | Backend | Frontend | Verdict |
|---|---|---|---|---|---|
| F-01 | Authentification (JWT) | Must | ✅ login/JWT HS256/bcrypt | ✅ Login + store + axios | 🟢 (⚠️ `/auth/refresh` absent) |
| F-02 | Gestion des rôles (RBAC 4 rôles) | Must | ✅ `require_role` | ✅ `ProtectedRoute`, sidebar filtrée | 🟢 |
| F-03 | Conteneurs (CRUD + localisation) | Must | ✅ CRUD + soft-delete | ✅ table + modal CRUD | 🟢 |
| F-04 | Carte colorée par statut | Must | ✅ `/containers/map` | ✅ Leaflet markers colorés | 🟢 |
| F-05 | Mesures IoT horodatées | Must | ✅ ingest + MQTT consumer | ✅ historique + polling | 🟢 |
| F-06 | Alertes seuil critique | Must | ✅ vue dérivée `/alerts` | ✅ AlertsBell/Panel | 🟢 |
| F-07 | Signalement citoyen | Must | ✅ `/reports` | ✅ NewReportPage | 🟢 |
| F-08 | Anti-doublon | Should | ✅ fenêtre 60 min, **409 confirmé** | ✅ gestion `DUPLICATE_REPORT` | 🟢 |
| F-09 | Tournées (génération) | Must | ✅ nearest-neighbor + 2-opt (pure) | ✅ wizard 3 étapes | 🟢 |
| F-10 | Agent (valider collecte) | Must | ✅ + RM-06 (mesure fill=5) | ✅ MyToursPage tactile | 🟢 |
| F-11 | Gamification (points) | Should | ✅ `points_events` | ✅ ProfilePage | 🟢 |
| F-12 | Analytics (≥5 KPIs + graphes) | Should | ✅ 12 KPIs + timeseries/heatmap | ✅ Dashboard + Analytics | 🟢 |
| F-13 | Exports CSV/PDF | Could | ✅ CSV + PDF (fpdf2) | ✅ download blob | 🟢 |
| F-14 | Journalisation actions sensibles | Must | ✅ `audit_service` | ✅ AuditLogsPage | 🟢 |

**Couverture fonctionnelle : 14/14.** Seule réserve : `/auth/refresh` figure au plan et au contrat `SYNC.md` mais n'est pas implémenté (le JWT de 60 min expire sans renouvellement → re-login obligatoire).

### 2.2 Critères d'acceptation

| # | Critère | Statut | Réserve |
|---|---|---|---|
| CA-01 | Connexion avec rôle défini | 🟢 démontrable | 4 comptes de démo présents |
| CA-02 | Carte statuts cohérents | 🟢 | logique de statut 100 % backend |
| CA-03 | Signalement → entrée + alerte visible | 🟢 | |
| CA-04 | Mesure simulée modifie l'état | 🟢 | via MQTT (pas de fallback HTTP dans le simulateur) |
| CA-05 | Tournée depuis conteneurs critiques | 🟢 | |
| CA-06 | Agent valide une étape | 🟢 | |
| CA-07 | Actions sensibles dans l'audit log | 🟢 | écran admin présent |
| CA-08 | Dashboard ≥5 KPIs corrects | 🟢 | 12 KPIs |

> Tous les CA sont **démontrables**, mais leur **preuve automatisée (tests)** n'est pas établie de façon reproductible — voir §9.

---

## 3. Audit Bloc 1 — Conception & analyse

**Points forts :**
- DCT (`ECOTRACK_DCT_V1.docx.md`, 1284 lignes) riche : résumé exécutif, périmètre inclus/exclu argumenté, hypothèses de volumétrie, acteurs, exigences F-01→F-14 priorisées (MoSCoW), CA, risques, annexes (algorithmes F.2/F.3, DDL, contrats API, plan de tests).
- §8.5 **MLD textuel complet** (table par table, colonnes + contraintes + index) et §8.6 **dictionnaire de données** présents.
- Règles métier RM-01→RM-06 formalisées et **réellement implémentées** côté backend.

**Manquements Bloc 1 :**

| ID | Manquement | Gravité | Détail |
|---|---|---|---|
| B1-1 | **MCD/MLD non disponibles en diagramme** | P2 | Le MCD n'existe que comme **image rasterisée** embarquée dans le .docx (`![][image3]`) ; le MLD/dictionnaire sont des **tables markdown**. Aucun diagramme entité-association « diagram-as-code » (aucun `erDiagram` mermaid trouvé). Pour A1, un MCD/MLD éditable et présentable est attendu. |
| B1-2 | **DCT en version V0.1 « À relire »** | P2 | L'historique de versions indique V0.1 (jamais passé en V1.0 validée pour dépôt). Risque de présentation d'un livrable non finalisé. |
| B1-3 | **Pas de justification écrite de la dérive ML** | P3 | Le DCT/plan annonce un RandomForest ; l'implémentation fait une régression linéaire numpy. Choix défendable mais **non tracé** dans un journal de décisions. |

---

## 4. Audit Bloc 2 — Backend

**Stack confirmée :** FastAPI, SQLAlchemy 2.0 async, Pydantic v2, Alembic, PostGIS, paho-mqtt, slowapi, fpdf2.

**Constats positifs vérifiés :**
- Architecture en couches respectée (`api/services/schemas/models/middleware/iot`).
- **RBAC réel** sur chaque route sensible (`require_role`, 403).
- **SQL entièrement paramétré** (bindings `:param`) ; les rares f-strings concernent des fragments statiques ou des valeurs **regex-validées** (`granularity`, `metric`) → pas d'injection.
- `status_engine.compute_status` et `route_optimizer` sont des **fonctions pures testables** (seuils 70/90 conformes RM-01/02/03).
- RM-06 implémenté (validation step → mesure `fill=5`).
- Handler 500 sans stack trace, headers de sécurité, CORS sans `*`.
- **Aucun TODO/FIXME/NotImplementedError** dans `app/`.

**Manquements backend :**

| ID | Manquement | Gravité | Détail |
|---|---|---|---|
| BK-1 | **`/auth/refresh` non implémenté** | P1 | Présent au plan + contrat `SYNC.md`. JWT 60 min sans renouvellement. |
| BK-2 | **`requirements.txt` incomplet** | P1 | `greenlet` (transitif SQLAlchemy async), `slowapi`, `shapely`, `python-multipart` non épinglés → install ne reproduit pas l'environnement (échec d'import au lancement des tests). |
| BK-3 | **ML : pas de livrable `data/`** | P2 | Prédiction = `numpy.polyfit` inline dans `prediction_service.py` ; pas de `train.py`, pas de `.joblib`, pas de RandomForest, pas de métriques MAE/R². |
| BK-4 | **Dépendances mortes** | P3 | `scikit-learn`/`pandas` épinglés mais inutilisés depuis le pivot polyfit. |
| BK-5 | **Pas de CSP/HSTS** | P3 | Headers de base présents, mais pas de Content-Security-Policy ni HSTS. |

---

## 5. Audit Bloc 2 — Frontend

**Stack confirmée :** Vite + React + TS, TailwindCSS v4, React Router, Zustand (persist), TanStack Query v5, Axios, Leaflet, Recharts, RHF + Zod, sonner, lucide.

**Constats positifs vérifiés :**
- `npm run typecheck` et `npm run build` : **0 erreur** (exécutés réellement). Affirmation `SYNC.md` confirmée.
- Toutes les données via **TanStack Query** (pas de `useEffect+fetch` sauvage).
- **Aucune logique métier dupliquée** du backend (statut/anti-doublon affichés, pas recalculés). Bonne séparation.
- Routing par rôle, redirection post-login, **page 404 présente**, ErrorBoundary global réel.
- Aucun `console.log` résiduel.

**Manquements frontend :**

| ID | Manquement | Gravité | Détail |
|---|---|---|---|
| FR-1 | **Aucun test** | P1 | Zéro fichier `*.test.tsx`/`*.spec.ts`. Vitest/Testing Library/MSW **non installés**, aucun script `test`. Plan §10 et livrable Dev « coverage >60 % » → **0 % réalisé**. C'est le plus gros écart plan/réalité. |
| FR-2 | **Types non générés (viole D-05)** | P2 | `src/types/api.gen.ts` absent ; `gen:types` jamais exécuté. Types écrits à la main (`index.ts`, 227 l.) → risque de dérive silencieuse vs contrat backend. |
| FR-3 | **Pas de code-splitting** | P2 | Aucun `React.lazy` ; bundle unique **1,2 Mo** (gzip 347 ko), warning Vite. Cible Lighthouse Perf ≥80 menacée. |
| FR-4 | **Pas de clustering carte** | P2 | Chaque conteneur = un `<Marker>`. Le plan l'imposait au-delà de 500 markers ; impact faible en démo (100 conteneurs) mais écart au plan. |
| FR-5 | **Dossiers composants vides** | P3 | `components/{ui,map,charts}/` ne contiennent que `.gitkeep` ; logique inline dans les pages (pas de réutilisabilité « composants » annoncée). |
| FR-6 | **Quelques `as any`** | P3 | 8 occurrences (casts Recharts + `onError`). Acceptable mais à nettoyer. |

---

## 6. Audit transverse — Données, IoT, Base, Infra, Docs

### 6.1 Base de données
🟢 DDL complet : 8+ tables, PostGIS (`GEOMETRY(POLYGON/POINT,4326)`), index GIST, FK `ON DELETE CASCADE`, CHECK (`fill_level BETWEEN 0 AND 100`, enums), UNIQUE. Seeds de 12 zones + users.

🔴 **DRIFT (DB-1, P1) :** `database/ddl/02_schema.sql` (monté par Docker au démarrage) et `backend/migrations/0001_init_schema.py` (Alembic, utilisé par les tests/CI) **divergent** :
- DDL = `VARCHAR + CHECK` ; Alembic = **types ENUM natifs**.
- DDL n'a **aucun CHECK sur `containers.status`** (VARCHAR libre).
- Alembic ajoute une colonne `points_events.reason` **absente du DDL**.
→ Pas de source de vérité unique ; le schéma exécuté en démo ≠ schéma testé en CI.

### 6.2 Simulateur IoT
🟢 `simulator.py` publie en MQTT (topic `ecotrack/measurements`, QoS 1) ; payload conforme (`container_id, fill_level, temperature, battery, measured_at`) ; le consumer backend écoute le même topic → chaîne MQTT bout-en-bout fonctionnelle.

🟡 **IOT-1 (P2) :** le docstring annonce un « fallback HTTP » mais **aucun code HTTP** n'existe (ni `requests`). Le `X-IoT-Token` n'est donc **jamais utilisé** par le simulateur (auth uniquement sur l'endpoint HTTP non sollicité). Le simulateur lit aussi les IDs **directement en base** (couplage DB).

### 6.3 Données / ML
🔴 **DATA-1 (P2) :** `data/notebooks/`, `data/scripts/`, `data/models/` ne contiennent que `.gitkeep`. Aucun notebook EDA, aucun `train.py`, aucun modèle sérialisé. Le livrable ML du plan n'existe pas en tant qu'artefacts (le prédicteur inline backend compense fonctionnellement).

### 6.4 Infrastructure & CI
🟢 `docker-compose.yml` : postgres+postgis, redis, mosquitto, backend, frontend, simulateur (profil). Dockerfiles backend + simulateur présents.

🔴 **INF-1 (P1) :** **`frontend/Dockerfile` manquant** alors que `docker-compose` le référence (`build: ./frontend`) → le service `frontend` **ne build pas**. Démo Docker complète cassée.

🟡 **CI-1 (P1) :** `.github/workflows/ci.yml` réel (postgis service, pytest, `npm typecheck`+`build`) **mais** : pas de step **lint** (ni ruff backend, ni `npm run lint`), **pas de coverage gate** (le seuil ≥60 % du plan n'est nulle part), et le workflow **ne se déclenche pas sur la branche `phase2`** (triggers `main`/`develop` uniquement) → la branche active n'est jamais validée par la CI.

### 6.5 Documentation (livrables)
🔴 **DOC-1 (P1) :** `docs/api/`, `docs/architecture/`, `docs/user-guide/` **entièrement vides** (`.gitkeep`). Pas d'`openapi.yaml` commité (seulement servi au runtime via `/docs`), **pas de diagramme d'architecture**, **pas de `docs/architecture/decisions.md`** (journal de décisions demandé au plan).

🟡 **DOC-2 (P3) :** `README.md` correct (install/run/comptes démo) mais **sur-promet** : il décrit `data/` (« notebooks, modèles ») et `docs/` (« OpenAPI, schémas ») qui sont vides.

---

## 7. Sécurité (périmètre Bloc 2 — sécurité applicative de base)

| ID | Constat | Gravité |
|---|---|---|
| SEC-1 | `SECRET_KEY` (JWT) défaut `"change_me_32_chars_min"` dans `config.py`, **aucune validation au démarrage** (pas de check « ≠ défaut / longueur ≥32 »). | P1 |
| SEC-2 | `.env.example` contient des secrets **faibles/prévisibles** (`SECRET_KEY=qwerty...1234567890`, `POSTGRES_PASSWORD=Admin001@`) et est lui-même **gitignoré** (`.gitignore:52`) → ni partagé proprement, ni exemplaire. | P2 |
| SEC-3 | `IOT_SERVICE_TOKEN` défaut `"dev-iot-token-change-in-production"` (token device prévisible). | P2 |
| SEC-4 | `model_config(env_file=".env")` relatif au **CWD** : lancé depuis `backend/`, le `.env` racine n'est pas lu → retombe sur les défauts (cause directe de l'échec des tests). | P1 |

**Bon points :** bcrypt, RBAC vérifié serveur, SQL paramétré, rate-limit login (5/5min), CORS whitelisté, pas de stack trace en 500, UUIDs (anti-IDOR), audit trail.

---

## 8. Tests & couverture (preuve)

| Cible | Réalité vérifiée |
|---|---|
| Backend — 108 fonctions de test (7 fichiers, ~1950 l.) | **Ne tournent pas en l'état** : `23/108` passent (uniquement les tests sans DB : `compute_status`, `optimize`, prédiction pure, headers, gardes 401/403). Les 85 autres échouent sur `InvalidPasswordError` (env_file/CWD, SEC-4) — **probablement verts avec une DB seedée, mais non prouvé**. |
| Backend coverage ≥60 % (plan/CI) | **Non mesurée**, pas de `pytest-cov`, pas de gate. |
| Frontend tests (Vitest/RTL/MSW) | **0 test, outils non installés.** |
| Frontend coverage ≥50 % | **0 %.** |

➡️ Affirmation `SYNC.md` « tests verts » : **non vérifiable / non reproductible**. C'est un risque majeur pour le critère « Tests » de la grille d'évaluation.

---

## 9. Hygiène Git & processus

| ID | Constat | Gravité |
|---|---|---|
| GIT-1 | **Rien n'est mergé sur `main`** : `main` = commit initial « first commit » ; tout le travail (10 commits) vit sur `phase2`. Aucune PR consolidée, branches `phase0`/`phase1_backend` orphelines. | P1 |
| GIT-2 | Le principe plan « une fonctionnalité = une PR » n'est pas traçable (historique non reflété sur `main`). | P2 |

---

## 10. Registre consolidé des manquements (priorisé)

### 🔴 P1 — À corriger avant soutenance (bloquant démo/évaluation)
1. **FR-1** — Aucun test frontend (installer Vitest+RTL+MSW, viser quelques tests critiques : Login, ReportForm, StatusBadge).
2. **BK-2 / SEC-4** — `requirements.txt` incomplet + `.env` non lu depuis `backend/` → **tests backend non exécutables**. Épingler `greenlet/slowapi/shapely/python-multipart`, fixer le chemin `.env`.
3. **INF-1** — Créer `frontend/Dockerfile` (sinon `docker compose up` échoue).
4. **DOC-1** — Remplir `docs/` : commiter `openapi.yaml` (script existant `export_openapi.py`), au moins 1 diagramme d'architecture, le journal de décisions.
5. **DB-1** — Résoudre la dérive DDL ↔ Alembic (choisir une source de vérité ; aligner enums + colonne `reason` + CHECK status).
6. **CI-1** — Ajouter lint + coverage gate, et déclencher la CI sur la branche de travail.
7. **SEC-1** — Validation `SECRET_KEY` au démarrage (refus si défaut).
8. **GIT-1** — Consolider le travail sur `main` (merge/PR).
9. **BK-1** — Implémenter `/auth/refresh` (ou retirer du contrat `SYNC.md` pour cohérence).

### 🟡 P2 — Améliorations attendues (qualité livrable / soutenance)
- **B1-1** MCD/MLD en diagramme présentable (mermaid `erDiagram` ou outil). · **B1-2** Passer le DCT en V1.0.
- **FR-2** Générer les types (`gen:types`) pour respecter D-05. · **FR-3** Code-splitting. · **FR-4** Clustering carte.
- **DATA-1 / BK-3** Fournir au moins un notebook d'entraînement + métriques (même si le predictor inline reste).
- **IOT-1** Implémenter réellement le fallback HTTP (et utiliser `X-IoT-Token`) ou retirer la mention.
- **SEC-2 / SEC-3** Secrets d'exemple neutres, `.env.example` **committé** (retirer de `.gitignore`), tokens non prévisibles.
- **CI / DOC-2** Aligner README avec la réalité.

### 🟢 P3 — Dette mineure / cosmétique
- **BK-4** Retirer deps mortes (scikit-learn/pandas). · **BK-5** CSP/HSTS.
- **FR-5** Extraire composants réutilisables `ui/map/charts`. · **FR-6** Nettoyer `as any`.
- **B1-3 / GIT-2** Journal de décisions + traçabilité PR.

---

## 11. Recommandation de plan d'amélioration (ordre suggéré)

1. **Débloquer la preuve** (1 j) : fixer deps+`.env` backend → faire passer les 108 tests ; ajouter `pytest-cov` et un mini-socle de tests frontend.
2. **Réparer la démo Docker** (0,5 j) : `frontend/Dockerfile` + vérifier `docker compose up` complet ; lever la dérive DDL/Alembic.
3. **Compléter les livrables** (1 j) : remplir `docs/` (OpenAPI commité, diagramme archi, journal de décisions), MCD/MLD en diagramme, DCT V1.0.
4. **Durcir** (0,5 j) : validation `SECRET_KEY`, secrets d'exemple, CI lint+coverage+branche.
5. **Polir** (0,5 j) : `/auth/refresh`, génération de types, code-splitting, nettoyage deps.

---

## 12. Conclusion

ECOTRACK est un **prototype fonctionnellement complet et soutenable** : les 14 exigences et 8 critères d'acceptation sont couverts, l'architecture est saine et les règles métier sont réellement côté backend. Le risque pour la soutenance n'est pas le « quoi » mais le « prouvable » : **tests non exécutables, documentation livrable vide, démo Docker partiellement cassée, dérive de schéma et secrets par défaut**. Les corrections P1 ci-dessus (≈3 jours) suffisent à transformer un bon prototype en un livrable Blocs 1 & 2 défendable et reproductible.
