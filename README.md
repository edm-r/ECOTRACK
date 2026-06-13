# ECOTRACK

Plateforme intelligente de gestion des déchets urbains.
Mastère 1 INGETIS — Bloc 2 — 2026.

## Lancer le projet

```bash
cp .env.example .env
docker compose up -d
```

API : http://localhost:8000/docs  
Frontend : http://localhost:5173

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
data/            Notebooks ML, modèles entraînés
docs/            Plans, API OpenAPI, schémas
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
