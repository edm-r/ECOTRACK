# ECOTRACK — Instructions agent Backend (correctifs)

> Ce fichier est lu par l'agent backend à chaque session de correctif.  
> Il contient le contexte, les règles de sécurité, et les tickets à traiter dans l'ordre.  
> Dernière mise à jour : **2026-06-13**

---

## Contexte agent

- Stack : **FastAPI 0.111 / SQLAlchemy 2.0 async / PostgreSQL 15 + PostGIS / Alembic / Pydantic v2**
- Tous les secrets viennent de `.env` à la racine du projet (jamais hardcodés)
- Schéma de base : `backend/database/ddl/02_schema.sql` + migrations Alembic dans `backend/migrations/`
- Tests : `backend/tests/` — 7 fichiers, 96 tests, driver `pytest-asyncio 0.23.7`
- Import critique : `asyncio_mode = auto` dans `pytest.ini`
- RBAC : chaque route sensible utilise `Depends(require_role(...))`
- Audit log : chaque mutation admin appelle `await log_event(...)` dans `app/services/audit_service.py`

---

## Règles de sécurité — NON NÉGOCIABLES

1. Aucun secret dans le repo — `.env` ignoré, `.env.example` à jour et commité
2. `SECRET_KEY` minimum 32 caractères — valider au démarrage, refuser sinon
3. Mots de passe stockés uniquement en hash bcrypt (librairie `bcrypt` directement)
4. JWT signés HS256 avec `SECRET_KEY`
5. Pas de stack trace dans les réponses 500 (handler global dans `main.py`)
6. SQL entièrement paramétré (bindings SQLAlchemy ou `:param` brut) — jamais de f-string avec données utilisateur
7. RBAC vérifié côté serveur sur chaque route sensible

---

## Tickets ouverts — traiter dans l'ordre

### TICKET BK-SEC4 ⚡ PRIORITÉ 1 — Tests non exécutables

**Symptôme :** `cd backend && pytest` → `InvalidPasswordError` ou connexion refusée car `.env` non chargé.

**Cause :** `pydantic-settings` cherche `.env` en CWD (`backend/`). Le `.env` est à la racine du projet.

**Fix à appliquer dans `backend/app/core/config.py` :**

```python
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).parents[3] / ".env",  # racine projet
        env_file_encoding="utf-8",
        extra="ignore",
    )
```

> `parents[3]` = `config.py` → `core/` → `app/` → `backend/` → racine  
> Tester : `cd backend && python -c "from app.core.config import settings; print(settings.POSTGRES_PASSWORD)"`

**Acceptance :** `cd backend && pytest` passe au moins 23 tests (les tests purement unitaires) sans erreur de config.

---

### TICKET BK-2 ⚡ PRIORITÉ 1 — requirements.txt incomplet

**Symptôme :** `pip install -r requirements.txt` dans un venv propre → `ImportError` sur `greenlet`, `slowapi`, `shapely`, `python-multipart`.

**Fix :** Vérifier les imports dans `app/` et ajouter toutes les dépendances non épinglées. Commande de contrôle :

```bash
cd backend && pip install -r requirements.txt && python -c "import app.main"
```

**Dépendances à vérifier / ajouter :**

| Package | Version connue | Où utilisé |
|---|---|---|
| `greenlet` | `>=3.0` | SQLAlchemy async bridge |
| `slowapi` | `0.1.9` | Rate limiting dans `main.py` |
| `shapely` | `>=2.0` | GeoAlchemy2, geo utils |
| `python-multipart` | `>=0.0.9` | `Form(...)` dans FastAPI |
| `anyio` | `>=4.0` | asyncio backend pytest |

**Acceptance :** `pip install -r requirements.txt` + `python -c "import app.main"` = succès dans venv propre.

---

### TICKET SEC-1 — Validation SECRET_KEY au démarrage

**Fichier :** `backend/app/core/config.py` + `backend/app/main.py`

**Fix :** Ajouter un validator Pydantic sur le champ `SECRET_KEY` :

```python
from pydantic import field_validator

class Settings(BaseSettings):
    SECRET_KEY: str = "dev-secret"

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_min_length(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError(
                "SECRET_KEY must be at least 32 characters — "
                "generate one with: openssl rand -hex 32"
            )
        return v
```

Mettre à jour `.env.example` avec une valeur de 64 chars et le commentaire ci-dessus.

**Acceptance :** Démarrer avec `SECRET_KEY=short` → `ValidationError` au lancement, pas de démarrage silencieux.

---

### TICKET BK-1 — Endpoint /auth/refresh

**Fichier :** `backend/app/api/v1/auth.py`

**Contexte :** Les access tokens ont une durée limitée (`ACCESS_TOKEN_EXPIRE_MINUTES`). Sans refresh, l'utilisateur est déconnecté dès expiration. Le contrat SYNC.md mentionne ce endpoint.

**Schéma à implémenter :**

```
POST /api/v1/auth/refresh
Body  : { "refresh_token": "..." }
Retour: { "access_token": "...", "token_type": "bearer" }
Erreur: 401 si refresh_token invalide ou expiré
```

**Implémentation suggérée :**
- Refresh token = JWT avec `type: "refresh"` et durée `REFRESH_TOKEN_EXPIRE_DAYS` (ex: 7 jours)
- À l'émission du login, retourner aussi le refresh token
- À `/auth/refresh`, vérifier la signature et le type, émettre un nouvel access token

**Fichiers à modifier :**
- `app/services/auth_service.py` — `create_refresh_token()`, `create_access_token_from_refresh()`
- `app/api/v1/auth.py` — nouveau endpoint `POST /refresh`
- `app/schemas/auth.py` — `TokenResponse` + `RefreshRequest`

**Acceptance :** `POST /auth/login` retourne `{ access_token, refresh_token }`. `POST /auth/refresh` avec refresh valide retourne un nouvel `access_token`. Refresh expiré ou forgé → 401.

---

### TICKET DB-1 — Synchroniser DDL ↔ Alembic

**Fichier :** `database/ddl/02_schema.sql`

**Divergences connues :**
1. DDL utilise `VARCHAR(20) CHECK (...)` pour les enums ; migration Alembic crée de vrais types `ENUM` PostgreSQL
2. Colonne `reason` absente du DDL Docker mais présente dans les migrations

**Fix :**
- Regénérer `02_schema.sql` depuis le schéma Alembic actuel : `alembic upgrade head` dans un Postgres propre, puis `pg_dump --schema-only`
- OU corriger manuellement les divergences dans le DDL

**Commande pour dump propre :**
```bash
docker compose run --rm backend alembic upgrade head
docker exec ecotrack-postgres-1 pg_dump -U ecotrack --schema-only ecotrack > database/ddl/02_schema_generated.sql
```

**Acceptance :** `docker compose down -v && docker compose up` → schéma identique que `alembic upgrade head`.

---

### TICKET DOC-1 — Générer et commiter la doc

**Commande :**
```bash
cd backend && python scripts/export_openapi.py
```

**Vérifie que `docs/api/openapi.yaml` est généré correctement.**

Ensuite ajouter dans `docs/architecture/` :
- `README.md` avec diagramme de déploiement (ASCII acceptable pour la soutenance)
- `decisions.md` avec au moins : choix polyfit vs ML, choix paho-mqtt + bridge asyncio, choix bcrypt directe vs passlib

**Acceptance :** `docs/api/openapi.yaml` existe et est commité. `docs/architecture/decisions.md` existe.

---

### TICKET GIT-1 — Merge phase2 → main

> **Attention : action irréversible sur le remote — confirmer avec l'utilisateur avant push.**

**Étapes :**
1. S'assurer que tous les tests passent sur `phase2`
2. Ouvrir une PR `phase2 → main` (ou merge direct selon workflow)
3. `main` doit être la branche de livraison pour la soutenance

---

### TICKET BK-4 — Supprimer les dépendances mortes (P3)

**Retirer de `requirements.txt` :**
- `scikit-learn` — remplacé par `numpy.polyfit`
- `pandas` — aucune utilisation confirmée

**Vérifier avant suppression :**
```bash
grep -r "import sklearn\|from sklearn\|import pandas\|from pandas" backend/app/
```

Si grep retourne 0 résultats → supprimer les lignes.

---

### TICKET BK-5 — CSP et HSTS (P3)

**Fichier :** `backend/app/main.py` — middleware `add_security_headers`

**Headers à ajouter :**
```python
response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
response.headers["Content-Security-Policy"] = (
    "default-src 'self'; "
    "script-src 'self'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data:; "
    "connect-src 'self'"
)
```

> Note : HSTS n'a d'effet qu'en HTTPS. En dev HTTP, le navigateur l'ignore silencieusement.

---

## Comment signaler qu'un ticket est terminé

Mettre à jour `SUIVI_BACKEND.md` :
1. Changer `🔲 À faire` → `✅ Fait (YYYY-MM-DD)`
2. Ajouter une ligne dans le tableau **Bugs corrigés**
3. Mettre à jour le **Statut global** si une dimension est résolue
