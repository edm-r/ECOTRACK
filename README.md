# ECOTRACK

Plateforme intelligente de gestion des déchets urbains.
Mastère 1 INGETIS — Bloc 2 — 2026.

## Lancer le projet

```bash
cp .env.example .env

# Mode prod-like : frontend buildé et servi par Nginx
docker compose up -d

# Mode développement : frontend Vite avec hot reload (override)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

API : http://localhost:8000/docs  
Frontend : http://localhost:5173

> Redis est réservé pour un cache futur (non utilisé en M1) ; le service est commenté dans `docker-compose.yml`.

## Comptes de démo

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@ecotrack.fr | Password1! |
| Gestionnaire | gestionnaire@ecotrack.fr | Password1! |
| Agent | agent1@ecotrack.fr | Password1! |
| Citoyen | citoyen1@ecotrack.fr | Password1! |

## Structure

```
frontend/        SPA React + TypeScript + Leaflet
backend/         API FastAPI + SQLAlchemy + PostGIS
database/        DDL, migrations Alembic, seeds
iot-simulator/   Simulateur MQTT (Python)
data/            Notebooks ML, modèles entraînés (à venir)
docs/            Spécification OpenAPI ; architecture & guide utilisateur (à venir)
```

## Développement local (sans Docker)

```bash
# Backend
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```
