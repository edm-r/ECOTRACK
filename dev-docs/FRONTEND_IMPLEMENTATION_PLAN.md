# ECOTRACK — Plan d'implémentation Frontend

**Référence DCT :** ECOTRACK_DCT_V1
**Stack :** Vite + React 18 + TypeScript · TailwindCSS · React Router v6 · Zustand · TanStack Query · Axios · Leaflet · Recharts · React Hook Form + Zod
**Périmètre :** Bloc 2 (M1) — SPA web responsive démontrable en soutenance.

---

## 0. Principes directeurs (non négociables)

- **Mobile-first** sur les vues agent et citoyen. Desktop-first sur dashboard et admin.
- **Aucune logique métier critique côté front.** Le calcul du statut conteneur, l'anti-doublon, la génération de tournée → toujours backend.
- **Tous les fetchs passent par TanStack Query** (cache, invalidation, retry, optimistic updates si besoin). Pas de `useEffect + fetch` à la main.
- **Types partagés** : générer les types TS depuis l'OpenAPI du backend (`openapi-typescript`) — pas de re-déclaration manuelle des contrats.
- **Pas d'IDs ou rôles dans le localStorage en clair** : uniquement le JWT. Le décodage du payload fournit role/sub.
- **Le JWT expire à 60min** → intercepteur Axios qui catch 401 → redirige `/login`.
- **Accessibilité** : tout libellé important a son texte (jamais juste une couleur). Couleurs status accompagnées de labels et d'icônes.
- **Pas de console.log laissés** en production. Logger via `app/lib/logger.ts` (no-op en prod).
- **Une page = un dossier** dans `pages/` avec sa logique locale (`index.tsx`, hooks dédiés, composants enfants).

---

## 1. Phases — vue d'ensemble

| Phase | Objectif | Démontre | Critères acceptation DCT |
|------|----------|----------|--------------------------|
| **0** | Setup outillage (Vite, Tailwind, ESLint, Prettier, openapi-typescript) | App vierge démarre | — |
| **1** | Auth flow + layout + routing par rôle | Login → redirection contextuelle | CA-01, F-01, F-02 |
| **2** | Carte + liste conteneurs | Vue gestionnaire avec carte colorée | CA-02, F-04 |
| **3** | Signalement citoyen + profil + points | Parcours citoyen complet | CA-03, F-07, F-11 |
| **4** | Temps réel (polling) + alertes UI | Mesures simulateur reflétées en <30s | CA-04, F-05, F-06 |
| **5** | Tournées (gestionnaire + agent) | Création → assignation → validation collecte | CA-05, CA-06, F-09, F-10 |
| **6** | Dashboard KPIs + graphiques + prédiction | 5+ KPIs + 3+ charts | CA-08, F-12 |
| **7** | Admin (backoffice users + audit logs) + export + polish responsive | Backoffice complet, démo stable | CA-07, F-13 |

---

## 2. Phase 0 — Setup (à compléter)

### 2.1 Init projet (déjà fait selon user — vérifier)

Commandes attendues :
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2.2 Dépendances à installer

| Package | Version | Usage |
|---|---|---|
| `react-router-dom` | 6.x | Routing |
| `zustand` | 4.x | Store global (auth, UI) |
| `@tanstack/react-query` | 5.x | Server state, cache |
| `@tanstack/react-query-devtools` | 5.x | Dev only |
| `axios` | 1.x | Client HTTP |
| `react-hook-form` | 7.x | Formulaires |
| `zod` | 3.x | Validation schémas |
| `@hookform/resolvers` | 3.x | Bridge zod ↔ rhf |
| `leaflet` | 1.9.x | Carte |
| `react-leaflet` | 4.x | Wrapper React |
| `@types/leaflet` | 1.9.x | Types |
| `recharts` | 2.x | Graphiques |
| `lucide-react` | latest | Icônes |
| `clsx` + `tailwind-merge` | — | Helpers classes |
| `sonner` | latest | Toasts notifications |
| `date-fns` | 3.x | Dates |
| `openapi-typescript` | dev | Génération types depuis Swagger |

### 2.3 Config Tailwind (`tailwind.config.js`)

```js
content: ["./index.html", "./src/**/*.{ts,tsx}"],
theme: {
  extend: {
    colors: {
      status: {
        normal:      "#22c55e", // vert
        watch:       "#f59e0b", // orange
        critical:    "#ef4444", // rouge
        maintenance: "#6b7280", // gris
        unknown:     "#3b82f6", // bleu
      },
    },
  },
},
```

### 2.4 Scripts `package.json`

```json
"scripts": {
  "dev":       "vite",
  "build":     "tsc -b && vite build",
  "preview":   "vite preview",
  "lint":      "eslint . --ext ts,tsx",
  "typecheck": "tsc --noEmit",
  "gen:types": "openapi-typescript http://localhost:8000/openapi.json -o src/types/api.gen.ts"
}
```

### 2.5 Structure dossiers (déjà créée — à utiliser)

```
src/
├── components/
│   ├── ui/         # Button, Input, Card, Modal, Badge, Table, Skeleton
│   ├── layout/     # AppShell, Sidebar, Navbar, Footer, ProtectedRoute
│   ├── map/        # MapContainer, ContainerMarker, ZonePolygon, MapLegend
│   └── charts/     # KpiCard, LineChart, BarChart, HeatmapGrid, GaugeChart
├── pages/
│   ├── auth/       # login, register
│   ├── dashboard/  # manager dashboard
│   ├── containers/ # list + detail
│   ├── tours/      # routes management
│   ├── reports/    # citizen reports
│   ├── profile/    # citizen profile
│   ├── admin/      # users, audit-logs
│   └── analytics/  # charts + predictions
├── services/       # api client + endpoints typés
├── hooks/          # useAuth, useMap, useDebounce, etc.
├── store/          # zustand stores
├── types/          # types métier + api.gen.ts (généré)
├── utils/          # cn, formatters, constants
└── router/         # routes config
```

### 2.6 ESLint + Prettier
- ESLint config : `eslint-config-react-app` ou `eslint:recommended` + plugins react/hooks/jsx-a11y.
- Prettier : 2 spaces, single quotes, semicolons.
- Husky + lint-staged : pre-commit lint + typecheck.

### 2.7 Critères de sortie phase 0
- `npm run dev` démarre sur :5173.
- `npm run typecheck` passe.
- Tailwind fonctionne (test : couleur custom rendue).
- `npm run gen:types` réussit (après que le backend ait Swagger).

---

## 3. Phase 1 — Auth, layout, routing par rôle

### 3.1 Modules à créer

| Fichier | Rôle |
|---|---|
| `src/lib/axios.ts` | Instance axios + intercepteurs |
| `src/services/auth.ts` | `login`, `register`, `refresh`, `me` |
| `src/store/auth.ts` | Zustand store `{user, token, login, logout}` |
| `src/hooks/useAuth.ts` | Helper `{user, isAuth, hasRole}` |
| `src/components/layout/ProtectedRoute.tsx` | Garde par rôle |
| `src/components/layout/AppShell.tsx` | Layout app (sidebar + topbar + main) |
| `src/components/layout/Sidebar.tsx` | Nav filtrée par rôle |
| `src/pages/auth/Login.tsx` | Formulaire login |
| `src/pages/auth/Register.tsx` | Inscription citoyen |
| `src/router/index.tsx` | Routes config |

### 3.2 Axios instance (`src/lib/axios.ts`)

- baseURL = `import.meta.env.VITE_API_BASE_URL`.
- Intercepteur request : injecte `Authorization: Bearer ${token}` depuis le store auth.
- Intercepteur response : si 401 → logout store + redirect `/login` + toast "Session expirée".
- Si 403 → toast "Accès refusé" (mais pas de logout).
- Si 5xx → toast erreur générique.

### 3.3 AuthStore (Zustand + persistance localStorage)

```ts
interface AuthState {
  token: string | null;
  user:  UserOut | null;
  setSession: (token: string, user: UserOut) => void;
  logout: () => void;
}
```

Persistance : middleware `persist` (key `ecotrack-auth`). Au démarrage app : si token présent → appel `GET /me` pour valider (sinon logout).

### 3.4 Routing par rôle

| Path | Accès | Composant |
|---|---|---|
| `/login` | Public | `Login` |
| `/register` | Public | `Register` |
| `/` | Auth | redirect selon rôle |
| `/dashboard` | MANAGER, ADMIN | `ManagerDashboard` |
| `/containers` | MANAGER, ADMIN | `ContainersList` |
| `/containers/:id` | MANAGER, ADMIN, AGENT | `ContainerDetail` |
| `/tours` | MANAGER, ADMIN | `ToursList` |
| `/tours/new` | MANAGER, ADMIN | `TourCreate` |
| `/tours/:id` | MANAGER, ADMIN, AGENT (si assigné) | `TourDetail` |
| `/my-tours` | AGENT | `AgentTours` |
| `/map` | CITIZEN | `CitizenMap` |
| `/reports/new` | CITIZEN | `ReportForm` |
| `/profile` | CITIZEN | `CitizenProfile` |
| `/analytics` | MANAGER, ADMIN | `AnalyticsPage` |
| `/admin/users` | ADMIN | `UsersAdmin` |
| `/admin/audit` | ADMIN | `AuditLogsAdmin` |

`ProtectedRoute` :
```tsx
<ProtectedRoute allow={['MANAGER','ADMIN']}>
  <ManagerDashboard />
</ProtectedRoute>
```
Pas authentifié → `/login`. Authentifié mais mauvais rôle → page 403.

### 3.5 Redirection post-login

| Rôle login | Redirige vers |
|---|---|
| CITIZEN | `/map` |
| AGENT | `/my-tours` |
| MANAGER | `/dashboard` |
| ADMIN | `/dashboard` |

### 3.6 Layout `AppShell`
- **Desktop** : sidebar fixe à gauche (240px), topbar (avatar+logout), main scrollable.
- **Mobile** : sidebar en drawer (hamburger), topbar collante.
- Sidebar adaptée au rôle (nav items différents).

### 3.7 Formulaire login
- React Hook Form + Zod schema.
- Champs : email, password.
- Erreurs inline.
- Loading state pendant submit.
- Lien "S'inscrire" → `/register` (citoyens uniquement).
- Encart visible "Comptes de démo" en bas (collapsible, pour soutenance).

### 3.8 Critères de sortie phase 1
- Login fonctionne pour 4 rôles → redirection correcte.
- Sidebar n'affiche que les liens autorisés.
- Refresh page → reste loggé.
- Logout vide localStorage et redirige login.

---

## 4. Phase 2 — Carte & liste conteneurs

### 4.1 Modules

| Fichier | Rôle |
|---|---|
| `src/services/containers.ts` | `list`, `getById`, `getMap`, `create`, `update`, `getMeasurements` |
| `src/services/zones.ts` | `list`, `getStats` |
| `src/hooks/useContainersMap.ts` | TanStack query pour `/containers/map` |
| `src/components/map/MapContainer.tsx` | Leaflet root component |
| `src/components/map/ContainerMarker.tsx` | Marker coloré par statut |
| `src/components/map/ZonePolygon.tsx` | Polygones zones (toggle) |
| `src/components/map/MapLegend.tsx` | Légende couleurs |
| `src/components/map/MapFilters.tsx` | Sidebar filtres |
| `src/components/ui/StatusBadge.tsx` | Pill colorée + label |
| `src/components/ui/FillLevelBar.tsx` | Progress bar % |
| `src/pages/containers/ContainersList.tsx` | Table paginée |
| `src/pages/containers/ContainerDetail.tsx` | Carte + historique mesures |

### 4.2 Composant MapContainer
- Centre par défaut sur centroïde du seed (~ Paris 2.345, 48.86).
- Zoom initial 13.
- Couches :
  - Tiles : OpenStreetMap (attribution requise).
  - Polygones zones (toggle on/off).
  - Markers conteneurs avec **icônes circulaires colorées** par statut.
- **Clustering** au-delà de 200 markers visibles (`react-leaflet-cluster`).
- Popup au clic marker : qr_code, status badge, fill_level bar, lien "Détail".
- Légende fixe bas-droite.

### 4.3 Filtres carte (sidebar gauche compacte)
- Zone (multi-select).
- Statut (multi-select : NORMAL, WATCH, CRITICAL, MAINTENANCE, UNKNOWN).
- Niveau min (slider 0-100).
- Recherche par QR code (debounced).
- Filtres appliqués → re-fetch via TanStack Query avec clé incluant filtres.

### 4.4 Page ContainersList (vue table)
- Colonnes : QR, zone, type, statut (badge), niveau (bar), dernière mesure, actions.
- Tri par statut puis par niveau décroissant par défaut.
- Pagination serveur.
- Bouton "Créer un conteneur" (MANAGER+).

### 4.5 Page ContainerDetail
- Header : QR, zone, badge statut.
- Carte mini (1 marker).
- Graph line "Historique remplissage" (Recharts, 24h par défaut, toggle 7j/30j).
- Liste des derniers signalements.
- Actions : modifier (MANAGER+), désactiver (ADMIN), forcer une mesure de test (MANAGER+ — phase 3).

### 4.6 Critères de sortie phase 2
- Manager voit 100 conteneurs sur la carte, colorés correctement.
- Filtres fonctionnent.
- Clic marker → popup + détail.

---

## 5. Phase 3 — Signalement citoyen + gamification

### 5.1 Modules

| Fichier | Rôle |
|---|---|
| `src/services/reports.ts` | `create`, `listMine`, `getById` |
| `src/services/gamification.ts` | `getMyPoints` |
| `src/pages/reports/ReportForm.tsx` | Formulaire signalement |
| `src/pages/profile/CitizenProfile.tsx` | Profil + points + historique |
| `src/components/ui/PointsCounter.tsx` | Animation +N points |
| `src/pages/citizen/CitizenMap.tsx` | Carte avec bouton "Signaler" |

### 5.2 Parcours citoyen

1. Citoyen ouvre `/map` (auto après login).
2. Carte affiche les conteneurs (vue simplifiée — pas de filtres complexes, pas de détails techniques).
3. Bouton flottant "Signaler un problème" (FAB en bas à droite, plein écran sur mobile).
4. Clic FAB → modal `ReportForm` :
   - Si géoloc autorisée → présélectionne le conteneur le plus proche.
   - Sinon → liste cherchable des conteneurs.
   - Type (radio) : conteneur plein / endommagé / accès bloqué / autre.
   - Commentaire libre (optionnel, 500 chars max).
   - Photo (optionnel, phase 7 si temps).
   - Bouton "Envoyer".
5. Sur succès : toast "Signalement enregistré (+10 points)" avec animation `PointsCounter`.
6. Sur 409 (doublon) : modal "Vous avez déjà signalé ce conteneur récemment".

### 5.3 Profil citoyen (`/profile`)
- Header : nom, email, total points (gros chiffre).
- Section "Historique points" : liste 20 derniers événements (source + points + date).
- Section "Mes signalements" : timeline (open → confirmed/resolved/rejected).
- Section "Impact estimé" : badges (statique en M1, ex : "5 signalements ce mois").

### 5.4 Critères de sortie phase 3
- Signalement fonctionne de bout en bout.
- Anti-doublon affiche le message clair.
- Points crédités visibles immédiatement (refetch via TanStack invalidation).

---

## 6. Phase 4 — Temps réel & alertes UI

### 6.1 Stratégie M1 : polling intelligent
- WebSocket : **out of scope** M1 (complexité backend).
- Polling : TanStack Query `refetchInterval`.
  - Vue carte gestionnaire : 15s.
  - Dashboard KPIs : 30s.
  - Vue agent tournée active : 10s.
  - Profil citoyen : pas de polling.

### 6.2 Modules

| Fichier | Rôle |
|---|---|
| `src/services/alerts.ts` | `list`, `acknowledge` |
| `src/components/AlertsPanel.tsx` | Panneau latéral droit (dashboard) |
| `src/hooks/useAlertsToasts.ts` | Toaster sur nouvelles alertes |

### 6.3 UX alertes (dashboard manager)
- **Panneau "Alertes actives"** : liste triable, badges critiques, bouton "Voir sur la carte" (centre la carte sur le conteneur), bouton "Acquitter".
- **Toast Sonner** sur les nouvelles alertes apparues depuis le dernier poll (comparaison Set d'IDs en mémoire).
- **Indicateur de fraîcheur** : "Mis à jour il y a Xs" en bas de la carte.

### 6.4 Critères de sortie phase 4
- Simulateur IoT pousse une mesure → ≤ 30s plus tard la carte change et un toast apparaît.

---

## 7. Phase 5 — Tournées (manager + agent)

### 7.1 Modules

| Fichier | Rôle |
|---|---|
| `src/services/routes.ts` | `optimize`, `create`, `list`, `mine`, `getById`, `assign`, `validateStep` |
| `src/pages/tours/ToursList.tsx` | Liste manager |
| `src/pages/tours/TourCreate.tsx` | Wizard création |
| `src/pages/tours/TourDetail.tsx` | Carte + steps |
| `src/pages/tours/AgentTours.tsx` | Tournées du jour pour agent |
| `src/components/tours/RouteMap.tsx` | Carte avec polyline + numérotation |
| `src/components/tours/StepList.tsx` | Liste ordonnée avec actions |

### 7.2 Wizard création (manager)
3 étapes :
1. **Paramètres** : zone, seuil remplissage (slider, défaut 70), date prévue.
2. **Preview** : appel `POST /routes/optimize` → carte avec ordre proposé + distance estimée. Le manager peut réordonner manuellement (drag & drop) ou exclure des étapes.
3. **Assignation** : choix agent (dropdown des AGENT actifs) + confirmation → `POST /routes`.

### 7.3 Vue agent (`/my-tours`)
- Liste des tournées du jour (statut ASSIGNED ou IN_PROGRESS).
- Carte avec polyline numérotée + position GPS de l'agent si autorisé.
- Step actuel mis en surbrillance.
- 3 boutons gros tactiles :
  - **Démarrer la tournée** (passe IN_PROGRESS).
  - **Valider l'étape** (passe step DONE, passe au suivant).
  - **Signaler un problème** (modal : raison + commentaire → step ISSUE).
- À la fin : récap (temps, distance, # collectes).

### 7.4 Mobile-first agent
- Touch targets ≥ 48×48px.
- Pas de modale qui bloque la carte.
- Mode "follow GPS" toggleable.
- Lecture vocale optionnelle des prochaines étapes (out of scope M1 mais possible avec Web Speech API).

### 7.5 Critères de sortie phase 5
- Manager crée tournée à partir des critiques → assigne à un agent.
- Agent voit sa tournée, valide les étapes.
- Statut conteneur revient à NORMAL après validation (cf. RM-06 backend).

---

## 8. Phase 6 — Dashboard analytics + prédiction

### 8.1 Modules

| Fichier | Rôle |
|---|---|
| `src/services/analytics.ts` | `getKpis`, `getTimeseries`, `getTopZones`, `getHeatmap`, `getPrediction` |
| `src/pages/dashboard/ManagerDashboard.tsx` | Layout dashboard |
| `src/components/charts/KpiCard.tsx` | Card avec gros chiffre + trend |
| `src/components/charts/LineChart.tsx` | Wrapper Recharts |
| `src/components/charts/BarChart.tsx` | Wrapper Recharts |
| `src/components/charts/StatusPieChart.tsx` | Donut répartition statuts |
| `src/components/charts/HeatmapGrid.tsx` | Grille SVG/Canvas |
| `src/pages/analytics/AnalyticsPage.tsx` | Vue détaillée + prédictions |

### 8.2 Dashboard manager (`/dashboard`)

Layout 4 colonnes desktop :

```
┌─────────────────────────────────────────────────────────────────┐
│  KPI: Critiques  │  KPI: Alertes  │  KPI: Collectes  │  Avg fill │
├─────────────────────────────────────────────────────────────────┤
│  Line chart : remplissage moyen 7 derniers jours   │  Pie chart  │
│                                                    │  statuts    │
├─────────────────────────────────────────────────────────────────┤
│  Carte conteneurs (mini)                           │  Alertes    │
│                                                    │  actives    │
└─────────────────────────────────────────────────────────────────┘
```

Mobile : empilement vertical.

### 8.3 Page Analytics (`/analytics`)

- **Sélecteur** : zone, période (7j/30j/90j), granularité (heure/jour).
- **Charts** :
  1. Line chart : évolution niveau moyen par zone.
  2. Bar chart : top 10 zones par # alertes.
  3. Bar chart : signalements par type (FULL/DAMAGED/...).
  4. Heatmap : signalements sur grille géographique.
  5. Line chart : # collectes / jour.
- **Bouton "Exporter"** → modal choix format (CSV/PDF) → téléchargement.

### 8.4 Prédictions
- Section "Prédiction de remplissage" : sélection conteneur → graphe ligne avec :
  - Niveau actuel (point).
  - Trajectoire prédite H+24, H+48 (ligne pointillée).
  - Bande de confiance (zone grise).
- Tag "Modèle expérimental — données simulées" toujours visible.

### 8.5 Critères de sortie phase 6
- 5+ KPIs affichés, valeurs cohérentes avec backend.
- 3+ graphiques alimentés correctement.
- Prédiction démontrable sur au moins 1 conteneur.

---

## 9. Phase 7 — Admin, exports, polish, démo

### 9.1 Backoffice admin

| Page | Route | Description |
|---|---|---|
| Users | `/admin/users` | Table paginée + filtre rôle/statut, actions CRUD |
| User Create/Edit | modal | Form rhf + zod |
| Audit logs | `/admin/audit` | Table filtre par actor/action/dates |

### 9.2 Modal "Créer utilisateur"
- Champs : email, full_name, role (select), password (auto-gen possible), status.
- Erreurs serveur affichées (email déjà pris, etc.).

### 9.3 Audit logs viewer
- Filtres : acteur, action, type ressource, plage dates.
- Pagination 50/page.
- Détail JSON repliable par ligne.

### 9.4 Exports (UI déclenchant le backend)
- Bouton "Exporter" sur dashboard et analytics.
- Choix : période, format (CSV / PDF), KPIs inclus (checkboxes).
- Téléchargement direct depuis la réponse stream.

### 9.5 Polish
- Skeletons loaders sur toutes les listes.
- Empty states clairs ("Aucune tournée prévue aujourd'hui — créer ?").
- 404 page.
- Error boundary global (Sentry-ready mais pas obligatoire en M1).
- Mode sombre **out of scope** M1.
- A11y check : focus visible, ARIA labels sur icons-only buttons, contraste AA.
- Responsive check : iPhone SE (375px), iPad (768px), desktop (1280px+).

### 9.6 Build prod
- `npm run build` → bundle dans `dist/`.
- Servi par nginx dans une image Docker dédiée (phase ops).
- Variables d'env build-time via `VITE_*`.

### 9.7 Critères de sortie phase 7
- Toutes les routes accessibles depuis la nav par rôle.
- Aucune erreur console en mode prod.
- Scénario de démo soutenance répétable en < 8 min.

---

## 10. Tests

### 10.1 Pyramide
- **Unitaires** (~40%) : utils, formatters, hooks purs (Vitest).
- **Composants** (~40%) : Testing Library sur composants critiques (StatusBadge, FillLevelBar, MapFilters, ReportForm).
- **Intégration page** (~20%) : Login flow, Report creation, Tour creation (MSW pour mock API).
- **E2E** : 1 scénario Cypress (login manager → voir dashboard → créer tournée). Optionnel mais valorisant.

### 10.2 Setup tests
- Vitest + jsdom.
- Testing Library + user-event.
- MSW pour mocks HTTP.

### 10.3 Coverage cible
- ≥ 50% global, ≥ 70% sur `src/components/ui/`, `src/hooks/`, `src/services/`.

---

## 11. Performance

- **Code splitting** par route (`React.lazy` + `Suspense`).
- **Memoization** des markers Leaflet (les re-rendus carte sont chers).
- **Limites carte** : si > 500 markers visibles → activer clustering OBLIGATOIRE.
- **Virtualisation** des longues listes (table conteneurs > 200 lignes) via `@tanstack/react-virtual`.
- **Optimistic updates** sur validation step (UX instantanée).
- **Lighthouse cible** : Perf ≥ 80, A11y ≥ 90, Best Practices ≥ 90.

---

## 12. Traçabilité — couverture exigences DCT

| Exigence | Phase | Composant(s) clé(s) |
|---|---|---|
| F-01 Auth | 1 | `Login`, `AuthStore`, `useAuth` |
| F-02 Rôles | 1 | `ProtectedRoute`, `Sidebar` |
| F-03 Conteneurs CRUD | 2 | `ContainersList`, `ContainerDetail` |
| F-04 Carte | 2 | `MapContainer`, `ContainerMarker` |
| F-05 Mesures | 4 | polling + line chart historique |
| F-06 Alertes | 4 | `AlertsPanel`, toasts |
| F-07 Signalement | 3 | `ReportForm` |
| F-08 Anti-doublon | 3 | gestion erreur 409 |
| F-09 Tournées | 5 | `TourCreate` wizard |
| F-10 Validation agent | 5 | `AgentTours`, `StepList` |
| F-11 Gamification | 3 | `CitizenProfile`, `PointsCounter` |
| F-12 Analytics | 6 | `ManagerDashboard`, `AnalyticsPage` |
| F-13 Exports | 7 | bouton export + modal |
| F-14 Journalisation | 7 | `AuditLogsAdmin` |

---

## 13. Ordre de PR recommandé

1. PR-1 : Phase 0 (deps, tailwind, eslint, axios, store auth vide)
2. PR-2 : Phase 1.1 (login + register + protected route)
3. PR-3 : Phase 1.2 (AppShell + Sidebar par rôle)
4. PR-4 : Phase 2.1 (services containers/zones + types générés)
5. PR-5 : Phase 2.2 (MapContainer + markers + légende + filtres)
6. PR-6 : Phase 2.3 (ContainersList + ContainerDetail)
7. PR-7 : Phase 3 (ReportForm + CitizenProfile)
8. PR-8 : Phase 4 (polling + AlertsPanel + toasts)
9. PR-9 : Phase 5.1 (ToursList + TourCreate wizard)
10. PR-10 : Phase 5.2 (AgentTours + validation steps)
11. PR-11 : Phase 6.1 (ManagerDashboard + KpiCards + 2 charts)
12. PR-12 : Phase 6.2 (AnalyticsPage + heatmap + prédiction)
13. PR-13 : Phase 7.1 (admin users + audit logs)
14. PR-14 : Phase 7.2 (exports + polish + responsive final)

Chaque PR : ≤ 800 lignes diff, screenshots dans la description, type-check vert.

---

## 14. Définition de "fait" (par PR)

- [ ] TypeScript : `npm run typecheck` passe.
- [ ] Lint : `npm run lint` passe.
- [ ] Tests : ajoutés et verts pour les composants nouveaux/modifiés.
- [ ] Responsive : testé sur 375px, 768px, 1280px.
- [ ] A11y : pas d'erreur axe-core sur la page.
- [ ] Types API : régénérés si endpoints ajoutés (`npm run gen:types`).
- [ ] Pas de `console.log`, pas de `any` non justifié.
- [ ] Pas de logique métier dupliquée du backend (statut, anti-doublon, etc.).
- [ ] Screenshot du résultat dans la description PR.

---

## 15. Comptes de démo (à utiliser pour les tests E2E et la soutenance)

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@ecotrack.fr | Password1! |
| Manager | gestionnaire@ecotrack.fr | Password1! |
| Agent | agent1@ecotrack.fr | Password1! |
| Citoyen | citoyen1@ecotrack.fr | Password1! |

---

## 16. Scénario de démo soutenance (à valider à chaque fin de phase)

1. Login **admin** → dashboard.
2. Switcher en **gestionnaire** → voir carte 100 conteneurs.
3. Lancer le simulateur IoT en parallèle → observer un marker passer en rouge + toast d'alerte.
4. Switcher en **citoyen** → signaler ce conteneur → voir les +10 points dans le profil.
5. Retour **gestionnaire** → créer une tournée (wizard) sur la zone critique → assigner à `agent1`.
6. Switcher en **agent** → démarrer la tournée → valider les étapes une à une → conteneurs reviennent au vert.
7. Retour **gestionnaire** → ouvrir Analytics → montrer KPIs mis à jour + prédiction sur un conteneur.
8. **Admin** → ouvrir audit logs → montrer la traçabilité de toutes les actions.

**Temps cible : 6-8 minutes.**
