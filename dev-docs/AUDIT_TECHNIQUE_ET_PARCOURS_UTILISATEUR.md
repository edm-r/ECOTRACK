# ECOTRACK — Audit technique et parcours utilisateur

Date : 2026-06-13  
Portée : backend FastAPI, frontend React/Vite, base PostgreSQL/PostGIS, Docker, simulateur IoT, parcours par rôle.  
Objectif : lister les incohérences à corriger et vérifier la fluidité/cohérence des parcours utilisateur.

---

## 1. Résumé exécutif

ECOTRACK est fonctionnellement bien structuré : les grands modules métier existent, le frontend compile, les tests frontend passent, le code-splitting est actif, le backend couvre les phases principales et le schéma DDL est désormais aligné avec la migration initiale.

Les risques restants ne sont pas des manques fonctionnels majeurs, mais des incohérences de contrat et d'exploitation qui peuvent casser la démo ou rendre certains parcours frustrants :

- `docker compose frontend` est incohérent avec le nouveau `frontend/Dockerfile` Nginx.
- Le backend est sensible aux variables d'environnement génériques, notamment `DEBUG`.
- Les tests backend hors Docker ne sont pas isolés d'une DB réelle et échouent si `postgres` n'est pas résolu.
- Plusieurs types frontend ne correspondent pas aux schémas backend réels.
- Le refresh token existe côté backend mais n'est pas consommé côté frontend.
- Certains parcours UI affichent des filtres ou champs qui ne sont pas réellement appliqués côté backend.
- Le parcours agent peut rester bloqué si une étape est marquée `ISSUE`.

---

## 2. Vérifications exécutées

| Commande | Résultat | Commentaire |
|---|---:|---|
| `cd frontend && npm run typecheck` | OK | TypeScript ne détecte pas les dérives runtime car les types API sont manuels. |
| `cd frontend && npm test -- --run` | OK | 3 fichiers, 11 tests verts. |
| `cd frontend && npm run build` | OK | Build Vite OK, code-splitting actif. |
| `cd backend && ./.venv/bin/python -c "from app.main import app"` | KO puis OK avec `env -u DEBUG` | `DEBUG=release` dans l'environnement shell casse Pydantic. |
| `cd backend && env -u DEBUG ./.venv/bin/pytest -q` | KO | 23 pass, 85 fail, 16 warnings. Cause principale : host DB `postgres` non résolu hors Docker. |

---

## 3. Audit des incohérences techniques

### P0 — À corriger avant démonstration

| ID | Incohérence | Impact | Correction recommandée |
|---|---|---|---|
| TECH-01 | `docker-compose.yml` construit `frontend/Dockerfile` final Nginx, mais lance encore `npm run dev`, monte `/app`, et mappe `5173:5173`. L'image finale Nginx n'a pas `npm`. | `docker compose up frontend` risque de casser immédiatement. | Choisir un mode : soit service dev Node/Vite avec image Node, soit service prod Nginx avec `ports: "5173:80"` et sans commande/volumes dev. Idéal : `docker-compose.yml` prod + `docker-compose.dev.yml`. |
| TECH-02 | `Settings` lit des variables globales non préfixées. Une variable shell générique `DEBUG=release` casse l'import backend. | Backend et tests impossibles à lancer dans certains environnements. | Utiliser un préfixe d'env (`ECOTRACK_DEBUG`) ou retirer `DEBUG` du modèle si inutilisé. Ajouter une validation robuste ou ignorer les env globales non applicatives. |
| TECH-03 | Les tests backend utilisent la config DB réelle. Avec `.env` orienté Docker (`POSTGRES_HOST=postgres`), les tests locaux échouent hors réseau compose. | `pytest` non fiable pour dev local/CI hors Docker. | Introduire `.env.test`, surcharger `POSTGRES_HOST=localhost`, `POSTGRES_PORT=5433`, créer/vider une DB de test, appliquer Alembic avant tests, rollback fixture par test. |
| TECH-04 | La CI backend déclare Postgres mais ne lance ni Alembic ni seed avant `pytest`. | La CI risque d'échouer même si l'app importe. | Ajouter `alembic upgrade head` puis seed/minimal fixtures avant tests. |

### P1 — Contrats API/frontend

| ID | Incohérence | Impact | Correction recommandée |
|---|---|---|---|
| TECH-05 | Backend `TokenResponse` retourne `refresh_token`, mais `frontend/src/types/index.ts` ne le déclare pas, le store ne le garde pas, Axios ne l'utilise pas. | L'utilisateur est toujours déconnecté à expiration de l'access token. | Ajouter `refresh_token` au type, au store, au login/register, puis intercepteur `401 -> /auth/refresh -> retry`. |
| TECH-06 | `ContainerOut` frontend attend `fill_level`, `address`, `is_active`; backend retourne `fill_level_latest`, `type`, `capacity_l`, `created_at`, pas `address/is_active`. | Détail conteneur et liste affichent des valeurs vides ou incohérentes. | Générer les types depuis OpenAPI ou aligner manuellement. Côté UI, lire `fill_level_latest` ou normaliser dans `containerService`. |
| TECH-07 | `ZoneOut` frontend attend `geojson` et `critical_count`; backend retourne `geom`, `priority`, `created_at`, `container_count`. `ZoneStats` frontend attend `total_containers/by_status`; backend retourne des compteurs séparés. | Les composants zones peuvent afficher ou exploiter des champs inexistants. | Aligner les schémas ou introduire des adapters explicites dans `zoneService`. |
| TECH-08 | `AuditLogOut` frontend attend `ip_address`; backend retourne `ip`. | Colonne IP vide dans l'audit admin. | Renommer côté frontend en `ip` ou exposer `ip_address` côté backend. |
| TECH-09 | `/analytics/zones/top` retourne `{ zones: [...] }`; `analyticsService.getTopZones()` lit seulement `array` ou `{ items }`. | Dashboard/Analytics affichent un top zones vide malgré les données backend. | Lire `d.zones ?? d.items ?? []` ou modifier le backend en `{ items }`. |
| TECH-10 | Erreur doublon signalement : backend renvoie `{ detail: { detail: "DUPLICATE_REPORT", existing_id } }`; frontend attend `{ detail: "DUPLICATE_REPORT", existing_id }`. | Le toast spécifique doublon ne s'affiche probablement pas. | Standardiser le format erreur : code stable à plat, par exemple `{ code, existing_id }`, ou adapter le frontend. |

### P2 — Cohérence métier/exploitation

| ID | Incohérence | Impact | Correction recommandée |
|---|---|---|---|
| TECH-11 | Formulaire création conteneur demande `zone_id` et `address`, mais `ContainerCreate` backend ignore ces champs et recalcule la zone via lat/lng. | Le gestionnaire pense choisir une zone/adresse, mais ces valeurs ne sont pas sauvegardées. | Soit supprimer ces champs de l'UI, soit ajouter `address` en DB/schéma et décider si `zone_id` manuel est autorisé. |
| TECH-12 | Filtre statut des tournées envoyé par le frontend, mais `GET /routes` ne l'accepte pas côté backend. | Les onglets de statut dans `ToursPage` donnent une impression de filtre sans effet. | Ajouter `status: Optional[RouteStatus]` au endpoint/service ou retirer l'onglet. |
| TECH-13 | `complete_route()` backend ne valide pas l'état des étapes; l'UI bloque sur `ISSUE`, mais l'API permet de terminer directement si appelée. | Incohérence entre règles UI et règles serveur. | Définir la règle officielle : `DONE + ISSUE` autorisés ou `DONE + SKIPPED`. L'appliquer côté backend et frontend. |
| TECH-14 | `Redis` est provisionné dans Docker et config, mais aucun usage applicatif n'est présent. | Complexité infra inutile, confusion en soutenance. | Supprimer Redis ou documenter son futur usage. |
| TECH-15 | Simulateur IoT lit directement la DB pour récupérer les conteneurs, puis publie MQTT. Le fallback HTTP annoncé n'existe pas. | Couplage DB du simulateur et divergence documentation/code. | Soit documenter le choix DB+MQTT, soit ajouter un endpoint de découverte des conteneurs ou un vrai fallback HTTP avec `X-IoT-Token`. |
| TECH-16 | CSP/HSTS ajoutés côté backend API, mais l'app frontend Nginx ne pose pas de headers sécurité. | Hardening partiel : l'app servie au navigateur n'en profite pas. | Ajouter les headers dans `frontend/nginx.conf` pour la SPA, adapter `connect-src` à l'API. |
| TECH-17 | Les tests frontend existent mais la CI ne lance pas `npm test`. | Régressions UX non détectées en CI. | Ajouter `npm test -- --run` au job frontend. |
| TECH-18 | 16 warnings pytest : tests sync marqués `asyncio`. | Bruit de test et signal faible. | Retirer les marques async inutiles ou scinder les tests purement unitaires. |

### P3 — Dette de qualité

| ID | Incohérence | Impact | Correction recommandée |
|---|---|---|---|
| TECH-19 | `as any` reste dans Recharts. La dette est documentée, mais la règle agent dit "interdit sauf documenté inline". | Dette typage acceptable mais visible. | Ajouter des commentaires inline précis ou typer via les helpers Recharts. |
| TECH-20 | Types OpenAPI générés annoncés, mais les services utilisent encore `src/types/index.ts` manuel. | Les dérives API continueront à passer le typecheck. | Générer `src/types/api.gen.ts` et migrer progressivement les services critiques. |
| TECH-21 | Branches CI ciblées `main/develop`; les docs mentionnent encore `phase2`. | Risque de CI non déclenchée sur la branche réelle de livraison. | Aligner workflow Git et docs de livraison. |

---

## 4. Audit parcours utilisateur global

### 4.1 Parcours public : login / register

**Ce qui est fluide**

- Login avec comptes de démonstration intégré.
- Redirection par rôle claire : citoyen vers carte, agent vers tournée, manager/admin vers dashboard.
- Register simple et cohérent : création forcée en `CITIZEN`.

**Points à corriger**

| ID | Problème UX | Impact | Correction |
|---|---|---|---|
| UX-01 | Pas de mécanisme de retour à l'URL initiale après login. | Un utilisateur envoyé vers `/login` depuis une page protégée perd son contexte. | Ajouter un `redirectTo` dans l'état de navigation ou query param. |
| UX-02 | Le refresh token backend n'est pas utilisé. | Expiration = déconnexion brutale + perte de contexte. | Implémenter refresh silencieux dans Axios. |
| UX-03 | Les règles mot de passe frontend sont plus strictes que backend register. | Incohérence sécurité et messages différents selon l'entrée. | Harmoniser la validation backend/frontend. |

### 4.2 Parcours citoyen

**Parcours attendu**

1. Connexion ou inscription.
2. Arrivée sur `/map`.
3. Recherche/filtre d'un conteneur.
4. Signalement depuis la popup ou `/reports/new`.
5. Consultation profil/points/signalements.

**Ce qui est fluide**

- La carte est le bon point d'entrée pour un citoyen.
- Le formulaire de signalement en deux étapes est clair.
- Le signalement depuis une popup pré-remplit le conteneur.
- Le profil montre les points et l'historique des signalements.

**Points à corriger**

| ID | Problème UX | Impact | Correction |
|---|---|---|---|
| UX-04 | La sidebar citoyen n'a pas d'entrée directe "Signaler". | L'utilisateur doit passer par la carte ou connaître l'URL `/reports/new`. | Ajouter un item `Signaler` pour `CITIZEN` et `AGENT`. |
| UX-05 | Les filtres du panneau carte filtrent la liste, mais les marqueurs restent tous affichés. | Incohérence entre panneau et carte; difficile de comprendre le résultat du filtre. | Appliquer `filtered` aussi aux `Marker` affichés. |
| UX-06 | Sélectionner un conteneur dans la liste fait seulement `flyTo`, sans ouvrir la popup. | L'utilisateur doit recliquer manuellement sur le marqueur. | Stocker les refs marker/popup correctement et ouvrir la popup après sélection. |
| UX-07 | Erreur doublon signalement probablement affichée en générique à cause du contrat erreur. | L'utilisateur ne comprend pas qu'un signalement récent existe déjà. | Corriger le format d'erreur ou le parsing frontend. |
| UX-08 | Profil réservé aux citoyens. | Agent/manager/admin n'ont pas d'espace "mon compte" pour changer nom/mot de passe. | Ajouter `/profile` pour tous, avec sections spécifiques selon rôle. |

### 4.3 Parcours agent

**Parcours attendu**

1. Connexion agent.
2. Arrivée sur `/my-tours`.
3. Démarrage de la tournée assignée.
4. Validation des étapes ou signalement problème.
5. Finalisation de la tournée.
6. Accès carte et signalement terrain.

**Ce qui est fluide**

- Vue `/my-tours` mobile-first adaptée au terrain.
- Actions principales visibles : démarrer, collecter, problème.
- Polling actif pendant une tournée en cours.

**Points à corriger**

| ID | Problème UX | Impact | Correction |
|---|---|---|---|
| UX-09 | Sidebar agent ne contient que `Mes tournées`; pourtant `/map` et `/reports/new` sont autorisés. | L'agent ne peut pas naviguer naturellement vers la carte ou un signalement terrain. | Ajouter `Carte` et `Signaler` aux rôles agent dans `NAV_ITEMS`. |
| UX-10 | Une étape `ISSUE` empêche l'affichage du bouton "Terminer" côté UI. | Une tournée avec problème peut rester bloquée alors que le parcours métier prévoit ce cas. | Compter `ISSUE` comme état final ou ajouter une action `SKIPPED`; aligner avec backend. |
| UX-11 | `/routes/mine` ne retourne que les tournées du jour. | Un agent ne voit ni demain ni l'historique complet depuis son espace. | Ajouter onglets Aujourd'hui / À venir / Historique, ou endpoints filtrables. |
| UX-12 | `TourDetailPage` breadcrumb pointe vers `/tours`, interdit à l'agent. | L'agent peut tomber sur une page 403 en revenant par breadcrumb. | Adapter le breadcrumb : agent -> `/my-tours`, manager/admin -> `/tours`. |

### 4.4 Parcours manager

**Parcours attendu**

1. Arrivée dashboard.
2. Surveillance KPI/alertes.
3. Carte opérationnelle.
4. Gestion conteneurs.
5. Traitement signalements.
6. Planification et assignation des tournées.
7. Analytics/export.

**Ce qui est fluide**

- Dashboard opérationnel dense et adapté au rôle.
- Alertes visibles dans la topbar.
- Planification tournée guidée en étapes.
- Assignation agent présente dans liste et détail.

**Points à corriger**

| ID | Problème UX | Impact | Correction |
|---|---|---|---|
| UX-13 | Top zones vide à cause du contrat `{ zones }` vs `{ items }`. | Dashboard/Analytics semblent manquer de données. | Corriger `analyticsService.getTopZones`. |
| UX-14 | Création conteneur affiche `Zone` et `Adresse`, mais backend ne les conserve pas. | Perte de confiance : l'UI promet plus que le modèle. | Supprimer ou implémenter ces champs. |
| UX-15 | Détail conteneur lit `container.fill_level` alors que backend renvoie `fill_level_latest`. | Jauge de remplissage potentiellement `N/A` malgré des données. | Aligner type/service et composant. |
| UX-16 | Filtres statut tournées visibles mais non supportés par backend. | Le manager croit filtrer alors que les résultats ne changent pas. | Ajouter le filtre au backend ou retirer l'UI. |
| UX-17 | Sélecteur statut signalement propose toutes les valeurs, y compris transitions invalides ou statut courant. | Beaucoup de 422 évitables et feedback peu explicite. | Calculer les transitions autorisées côté frontend selon l'état courant. |
| UX-18 | Suppression conteneur = passage en `MAINTENANCE`, libellé "supprimer". | Ambiguïté destructive/non destructive. | Renommer en "Mettre en maintenance" ou ajouter une vraie suppression admin. |

### 4.5 Parcours admin

**Parcours attendu**

1. Dashboard manager + accès admin.
2. Gestion utilisateurs.
3. Audit logs.
4. Exports.

**Ce qui est fluide**

- Gestion utilisateurs claire : création, édition, désactivation.
- Garde contre auto-désactivation côté UI et backend.
- Audit logs paginé avec filtres.

**Points à corriger**

| ID | Problème UX | Impact | Correction |
|---|---|---|---|
| UX-19 | Audit logs affiche `ip_address`, backend retourne `ip`. | Colonne IP vide. | Aligner champ. |
| UX-20 | Audit logs ne montre pas `details`. | L'admin voit l'action mais pas toujours le contexte utile. | Ajouter drawer/détail JSON lisible. |
| UX-21 | Page 403 remplace tout le shell. | L'utilisateur perd navigation et logout depuis cette page. | Afficher 403 dans `AppShell` ou ajouter CTA retour/racine. |

### 4.6 Parcours transversal

| ID | Problème UX | Impact | Correction |
|---|---|---|---|
| UX-22 | La cloche notifications apparaît aussi pour citoyens/agents mais reste inactive. | Élément visuel inutile. | Masquer la cloche hors manager/admin ou afficher des notifications adaptées. |
| UX-23 | Mélange visuel fort : pages manager sombres, page agent très claire. | Pas bloquant, mais rupture d'identité visuelle. | Assumer par rôle et documenter, ou harmoniser quelques tokens communs. |
| UX-24 | Pas de gestion fine des états erreur sur toutes les pages data. | Certaines pages risquent de rester vides sans explication. | Ajouter `isError` et messages/actions retry sur dashboard, carte, analytics, listes. |
| UX-25 | Pas de confirmation contextuelle après certains changements serveur 422. | L'utilisateur ne sait pas si l'action est interdite métier ou erreur technique. | Mapper les erreurs backend connues vers des messages métier. |

---

## 5. Priorisation recommandée

### Sprint correctif court

1. Corriger Docker frontend compose (`TECH-01`).
2. Isoler la config backend des env globales et tests (`TECH-02`, `TECH-03`, `TECH-04`).
3. Aligner les contrats critiques frontend/backend (`TECH-05` à `TECH-10`).
4. Corriger le blocage agent sur étapes `ISSUE` (`UX-10`, `TECH-13`).
5. Corriger navigation agent/citoyen vers carte/signalement (`UX-04`, `UX-09`).

### Sprint qualité

1. Migrer services frontend vers types OpenAPI générés.
2. Ajouter seed/migration dans CI backend et `npm test` frontend.
3. Ajouter vrais états erreur/retry dans les pages data.
4. Clarifier modèle conteneur : adresse, zone manuelle ou zone auto.
5. Documenter Redis/simulateur IoT ou supprimer les parties non utilisées.

---

## 6. Critères de sortie avant soutenance

- `docker compose up` démarre backend + frontend + DB + Mosquitto sans override manuel.
- `GET /health` retourne `{"status":"ok"}`.
- Login demo pour les 4 rôles OK.
- Carte : filtres panneau et marqueurs cohérents.
- Citoyen : signalement + doublon + profil points OK.
- Agent : tournée avec une étape `ISSUE` peut être terminée selon la règle décidée.
- Manager : dashboard top zones non vide, conteneur détail affiche le remplissage, filtres tournées cohérents.
- Admin : audit logs affiche l'IP et les détails utiles.
- CI : backend applique migration puis tests; frontend typecheck + tests + build.

