"""
Fixtures partagées pour tous les tests backend.

Prérequis : base PostgreSQL de test accessible via POSTGRES_DB=ecotrack_test
(les autres vars POSTGRES_* peuvent venir du .env ou des variables d'environnement CI).
"""
import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.db.base import Base
from app.main import app
import app.models  # noqa: F401


# ── URL de test ────────────────────────────────────────────────────────────────
TEST_DB_URL = settings.DATABASE_URL.replace(
    f"/{settings.POSTGRES_DB}", "/ecotrack_test"
)

_engine = create_async_engine(TEST_DB_URL, echo=False)
_SessionFactory = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_test_schema():
    """Crée le schéma de test une fois par session (extensions + tables)."""
    async with _engine.begin() as conn:
        await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'))
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _engine.dispose()


@pytest_asyncio.fixture
async def db() -> AsyncSession:
    """Session avec rollback automatique après chaque test."""
    async with _engine.begin() as conn:
        async with _SessionFactory(bind=conn) as session:
            yield session
            await conn.rollback()


@pytest_asyncio.fixture
async def client() -> AsyncClient:
    """Client HTTP async branché sur l'app FastAPI."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c
