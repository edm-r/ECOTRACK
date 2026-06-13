# ECOTRACK — Instructions agent Frontend (correctifs)

> Ce fichier est lu par l'agent frontend à chaque session de correctif.  
> Il contient le contexte, les contraintes, et les tickets à traiter dans l'ordre.  
> Dernière mise à jour : **2026-06-13**

---

## Contexte agent

- Stack : **React 18 / TypeScript 5 / Vite / TanStack Query / Zustand / React Router v6**
- UI : **shadcn/ui + Tailwind CSS**
- Carte : **React Leaflet** (Leaflet 1.9)
- Graphiques : **Recharts**
- Tests : **Vitest + React Testing Library** (à installer — absent pour l'instant)
- Types API : générés depuis `docs/api/openapi.yaml` via `openapi-typescript` (`npm run gen:types`)
- Auth : JWT Bearer — token stocké en mémoire (Zustand), refresh token en `httpOnly cookie` ou `localStorage` selon implémentation
- API base URL : `VITE_API_URL` depuis `.env`

---

## Règles — NON NÉGOCIABLES

1. Aucun appel API avec URL hardcodée — toujours via `VITE_API_URL`
2. Jamais de secret dans le code frontend (tokens, clés)
3. Les `as any` sont interdits sauf cas documenté en commentaire inline
4. Chaque composant qui touche à l'API doit avoir son état de chargement ET son état d'erreur
5. RBAC côté frontend = UX seulement (masquer boutons) — la vraie vérification est toujours côté serveur

---

## Tickets ouverts — traiter dans l'ordre

### TICKET FR-INF1 ⚡ PRIORITÉ 1 — Dockerfile frontend manquant

**Symptôme :** `docker compose up` → erreur `failed to solve: failed to read dockerfile`.

**Fix : créer `frontend/Dockerfile`**

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
CMD ["nginx", "-g", "daemon off;"]
```

**Fix : créer `frontend/nginx.conf`**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Vérification :**
```bash
cd frontend && docker build -t ecotrack-frontend . && echo "BUILD OK"
```

**Acceptance :** `docker compose up frontend` démarre sans erreur. App accessible sur le port mappé.

---

### TICKET FR-1 ⚡ PRIORITÉ 1 — Installer Vitest + écrire les tests minimaux

**Étape 1 — Installation :**
```bash
cd frontend
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

**Étape 2 — `vitest.config.ts` (créer à la racine de `frontend/`) :**
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
});
```

**Étape 3 — `src/test/setup.ts` :**
```typescript
import "@testing-library/jest-dom";
```

**Étape 4 — Script dans `package.json` :**
```json
"scripts": {
  "test": "vitest run",
  "test:ui": "vitest --ui",
  "test:watch": "vitest"
}
```

**Étape 5 — Tests minimaux à écrire (8 tests = seuil soutenance)**

| Fichier de test | Composant | Scénario |
|---|---|---|
| `src/components/auth/__tests__/LoginPage.test.tsx` | `LoginPage` | Rendu sans crash |
| `src/components/auth/__tests__/LoginPage.test.tsx` | `LoginPage` | Submit sans email → message d'erreur visible |
| `src/components/auth/__tests__/PrivateRoute.test.tsx` | `PrivateRoute` | Sans token → navigate vers `/login` |
| `src/components/auth/__tests__/PrivateRoute.test.tsx` | `PrivateRoute` | Avec token → rend le composant enfant |
| `src/components/common/__tests__/StatusBadge.test.tsx` | Badge status | `status="FULL"` → texte "Plein" visible |
| `src/components/common/__tests__/StatusBadge.test.tsx` | Badge status | `status="OK"` → texte "OK" visible |
| `src/hooks/__tests__/useAuth.test.ts` | `useAuth` | `login()` met le token dans le store |
| `src/hooks/__tests__/useAuth.test.ts` | `useAuth` | `logout()` vide le store |

> Adapter les chemins selon l'arborescence réelle de `src/`. Lancer `find frontend/src -name "*.tsx" | head -20` pour explorer.

**Acceptance :** `cd frontend && npm test` → **≥ 8 tests verts**, 0 échec.

---

### TICKET FR-2 — Générer les types depuis OpenAPI

**Prérequis :** `docs/api/openapi.yaml` doit exister (créé par le script backend `export_openapi.py`).

**Installation :**
```bash
cd frontend && npm install -D openapi-typescript
```

**Script dans `package.json` :**
```json
"gen:types": "openapi-typescript ../docs/api/openapi.yaml -o src/api/types.ts"
```

**Exécution :**
```bash
npm run gen:types
```

**Utilisation dans le code :**
```typescript
import type { components } from "../api/types";
type ContainerOut = components["schemas"]["ContainerOut"];
```

Remplacer progressivement tous les `as any` sur les réponses API par les types générés.

**Acceptance :** `src/api/types.ts` existe et est commité. `npm run gen:types` se termine sans erreur.

---

### TICKET FR-3 — Code-splitting (lazy loading des pages)

**Fichier à modifier :** le fichier de routing principal (ex. `src/router/index.tsx`, `src/App.tsx`).

**Pattern à appliquer :**
```tsx
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

// AVANT
// import DashboardPage from "../pages/DashboardPage";

// APRÈS
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const MapPage        = lazy(() => import("../pages/MapPage"));
const AnalyticsPage  = lazy(() => import("../pages/AnalyticsPage"));
const AdminPage      = lazy(() => import("../pages/AdminPage"));
const RoutesPage     = lazy(() => import("../pages/RoutesPage"));

// Wrapper dans le JSX
function App() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Chargement...</div>}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* ... */}
      </Routes>
    </Suspense>
  );
}
```

**Vérification :**
```bash
cd frontend && npm run build 2>&1 | grep "kB"
```
Le chunk initial doit être < 300 Ko.

**Acceptance :** `npm run build` réussit. Bundle initial < 400 Ko (code-splitting actif).

---

### TICKET FR-4 — Clustering carte Leaflet

**Contexte :** Avec > 50 conteneurs, la carte freeze. React Leaflet Cluster résout le problème.

**Installation :**
```bash
npm install react-leaflet-cluster
```

**Usage dans le composant carte :**
```tsx
import MarkerClusterGroup from "react-leaflet-cluster";

// Dans le JSX, wrapper les Marker dans MarkerClusterGroup
<MapContainer ...>
  <TileLayer ... />
  <MarkerClusterGroup chunkedLoading>
    {containers.map((c) => (
      <Marker key={c.id} position={[c.lat, c.lng]}>
        <Popup>{c.label}</Popup>
      </Marker>
    ))}
  </MarkerClusterGroup>
</MapContainer>
```

**Acceptance :** Page carte charge avec 100 markers sans freeze. Les clusters s'affichent et s'éclatent au zoom.

---

### TICKET FR-5 — Dossiers composants vides

**Action :** `find frontend/src/components -type d` — identifier les dossiers vides.  
Pour chaque dossier vide lié à une feature livrée, vérifier si le composant est dans un autre dossier et déplacer, ou créer un composant minimal.

> Ne pas créer de fichiers placeholder vides — seulement du code réel ou supprimer le dossier.

---

### TICKET FR-6 — Supprimer les `as any` (P3)

**Recherche :**
```bash
grep -rn "as any" frontend/src/ --include="*.tsx" --include="*.ts"
```

Pour chaque occurrence :
1. Si la réponse API → utiliser les types de `src/api/types.ts` (ticket FR-2)
2. Si type d'événement → préciser le bon type DOM (`React.ChangeEvent<HTMLInputElement>`, etc.)
3. Si vraiment inévitable → commenter `// eslint-disable-next-line @typescript-eslint/no-explicit-any` avec raison

**Acceptance :** 0 `as any` sans commentaire justificatif dans `src/`.

---

## Comment signaler qu'un ticket est terminé

Mettre à jour `SUIVI_FRONTEND.md` :
1. Changer `🔲 À faire` → `✅ Fait (YYYY-MM-DD)`
2. Si des tests ont été ajoutés, mettre à jour le compteur de la section tests
3. Mettre à jour le **Statut global** si une dimension est résolue

---

## Commandes utiles pour l'agent

```bash
# Vérifier l'arborescence src/
find frontend/src -type f -name "*.tsx" | head -30

# Vérifier les imports cassés
cd frontend && npm run build 2>&1 | grep -i "error"

# Lancer les tests
cd frontend && npm test

# Générer les types (après que backend ait produit openapi.yaml)
cd frontend && npm run gen:types

# Vérifier le bundle size
cd frontend && npm run build 2>&1 | grep "kB"

# Chercher les as any
grep -rn "as any" frontend/src/ --include="*.tsx" --include="*.ts"
```
