# ECOTRACK — Suivi d'avancement Frontend

> Source de vérité pour l'agent frontend. Mise à jour après chaque correctif ou livraison.  
> Dernière mise à jour : **2026-06-13 (session correctifs)**

---

## Statut global

| Dimension | État | Dernière action |
|---|---|---|
| Fonctionnel (phases 0→7) | ✅ Complet | Phases 0→7 livrées |
| Tests unitaires | ✅ 11 tests verts | Vitest installé, 3 suites (store/hook/composant) |
| Types API générés | 🔴 Absent | `gen:types` non exécuté (nécessite backend actif) |
| Docker (image frontend) | ✅ Créé | `frontend/Dockerfile` + `nginx.conf` |
| Performance bundle | ✅ Code-splitting | Lazy loading sur toutes les pages, Suspense |
| Qualité code | ✅ Traité | `as any` documentés eslint-disable, dossiers vides supprimés |

---

## Phases d'implémentation

| Phase | Contenu | Statut | Tests | Notes |
|---|---|---|---|---|
| 0 | Vite + React + TS, routing, theme | ✅ | ❌ | Vitest non installé |
| 1 | Auth, login/register, guards | ✅ | ❌ | |
| 2 | Carte Leaflet, zones, conteneurs | ✅ | ❌ | Pas de clustering carte (FR-4) |
| 3 | Dashboard IoT, alertes temps réel | ✅ | ❌ | |
| 4 | Signalements, gamification | ✅ | ❌ | |
| 5 | Tournées, carte itinéraire | ✅ | ❌ | |
| 6 | Analytics, graphiques Recharts | ✅ | ❌ | |
| 7 | Admin panel, exports | ✅ | ❌ | |

---

## Correctifs en attente (par priorité)

### 🔴 P1 — Bloquants soutenance

| ID | Description | Fichier(s) concerné(s) | Statut |
|---|---|---|---|
| FR-1 | 0 tests : Vitest non installé, aucun fichier `.test.tsx` | `frontend/package.json`, `frontend/vitest.config.ts` | ✅ Fait (2026-06-13) — 11 tests verts |
| INF-1 | `frontend/Dockerfile` absent → `docker compose up` échoue sur le service `frontend` | `frontend/Dockerfile` | ✅ Fait (2026-06-13) |
| GIT-1 | Tout le travail sur `phase2` — `main` = commit initial non fonctionnel | Git workflow | 🔲 À faire (merge manuel) |

### 🟡 P2 — Qualité livrable

| ID | Description | Fichier(s) concerné(s) | Statut |
|---|---|---|---|
| FR-2 | Types OpenAPI jamais générés : `gen:types` non exécuté, `src/api/types.ts` probablement absent ou stale | `package.json` script `gen:types`, `src/api/types.ts` | 🟡 Bloqué (nécessite backend actif) |
| FR-3 | Pas de lazy loading / code-splitting : bundle ~1.2 Mo chargé en entier → score Lighthouse < 60 | `src/router/index.tsx` ou équivalent | ✅ Fait (2026-06-13) — toutes les pages en `lazy()` + `Suspense` |
| FR-4 | Pas de clustering sur la carte Leaflet : > 100 markers simultanés → UI freezes | `src/pages/map/MapPage.tsx` | ✅ Fait (2026-06-13) — filtrage viewport (BoundsTracker), buffer 20% |
| FR-5 | Dossiers de composants vides (ex. `src/components/charts/`, `src/components/ui/`, `src/components/map/`) | Dossiers concernés | ✅ Fait (2026-06-13) — 3 dossiers supprimés |

### 🟢 P3 — Dette mineure

| ID | Description | Fichier(s) concerné(s) | Statut |
|---|---|---|---|
| FR-6 | 8 occurrences `as any` — perd la sûreté de type | Grep : `src/**/*.tsx` | ✅ Fait (2026-06-13) — 6 occurrences documentées `eslint-disable` (inévitable : Recharts `Formatter<>` générique) |
| FR-7 | `console.log` de debug probablement en place | Grep : `src/**/*.tsx` | ✅ Fait (2026-06-13) — aucun `console.*` trouvé |

---

## Tests à écrire — liste minimale P1

> Objectif : au moins **8 tests passants** pour la soutenance.

| # | Composant/page à tester | Type | Scénario prioritaire |
|---|---|---|---|
| 1 | `LoginPage` | Render | Formulaire vide → bouton désactivé |
| 2 | `LoginPage` | Interaction | Submit avec identifiants → appel `POST /auth/login` |
| 3 | `PrivateRoute` | Logique | Sans token → redirect vers `/login` |
| 4 | `PrivateRoute` | Logique | Avec token → render enfant |
| 5 | `ContainerStatusBadge` | Render | Status `FULL` → badge rouge |
| 6 | `AlertBanner` | Render | Props `level=CRITICAL` → classe CSS correcte |
| 7 | `useAuth` hook | Hook | `login()` stocke token, `logout()` le vide |
| 8 | `ReportForm` | Interaction | Soumission → appel API avec `container_id` |

---

## Infrastructure Docker manquante

Le `docker-compose.yml` référence un service `frontend` qui requiert un `Dockerfile`.

**Fichier à créer : `frontend/Dockerfile`**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Fichier compagnon : `frontend/nginx.conf`**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
    }
}
```

---

## Performance — quick wins code-splitting

```tsx
// router/index.tsx — avant
import DashboardPage from "../pages/DashboardPage";

// après (lazy + Suspense)
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
// Wrapper dans <Suspense fallback={<Spinner />}>
```

Appliquer pour : `DashboardPage`, `MapPage`, `AnalyticsPage`, `AdminPage`, `RoutesPage`.  
Gain estimé : bundle initial < 300 Ko.

---

## Bugs connus (runtime)

| Date | Symptôme | Cause probable | Statut |
|---|---|---|---|
| — | Types `any` sur réponses API | `gen:types` jamais exécuté | 🔲 FR-2 |
| — | Map freeze sur grand dataset | Pas de clustering | 🔲 FR-4 |

---

## Checklist avant soutenance

- [x] `npm test` depuis `frontend/` → **11 tests verts** ✅
- [x] `Dockerfile` + `nginx.conf` créés ✅
- [x] Code-splitting actif — toutes les pages en `lazy()` + `Suspense` ✅
- [x] Carte : `BoundsTracker` limite les markers au viewport (buffer 20%) ✅
- [x] Dossiers vides supprimés (`ui/`, `charts/`, `map/`) ✅
- [x] `as any` commentés `eslint-disable` avec justification ✅
- [x] 0 `console.*` dans `src/` ✅
- [ ] `npm run build` → succès, vérifier bundle < 600 Ko
- [ ] `docker compose up frontend` → container démarre, app accessible sur `:80`
- [ ] `npm run gen:types` → nécessite backend actif sur `:8000` (FR-2 bloqué)
- [ ] `main` = branche de livraison (GIT-1 — merge manuel à faire)
