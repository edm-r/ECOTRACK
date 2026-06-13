"""
Script de seed idempotent.

Usage :
    cd backend
    python -m scripts.seed

Crée :
  - 12 zones (polygones PostGIS)
  - 6 utilisateurs de démo (bcrypt réel)
  - 100 conteneurs répartis dans les zones
  - ~2 400 mesures IoT (24 h d'historique par conteneur, 1/heure)
"""
import asyncio
import logging
import random
import uuid
from datetime import datetime, timedelta, timezone

from passlib.hash import bcrypt
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.config import settings
from app.core.logging import setup_logging

setup_logging()
log = logging.getLogger("seed")

# ── Zones ─────────────────────────────────────────────────────────────────────
# (name, priority, wkt_polygon)
ZONES = [
    ("Centre-Ville",     1, "POLYGON((2.330 48.860, 2.360 48.860, 2.360 48.875, 2.330 48.875, 2.330 48.860))"),
    ("Nord",             2, "POLYGON((2.330 48.875, 2.360 48.875, 2.360 48.890, 2.330 48.890, 2.330 48.875))"),
    ("Sud",              2, "POLYGON((2.330 48.845, 2.360 48.845, 2.360 48.860, 2.330 48.860, 2.330 48.845))"),
    ("Est",              3, "POLYGON((2.360 48.855, 2.390 48.855, 2.390 48.870, 2.360 48.870, 2.360 48.855))"),
    ("Ouest",            3, "POLYGON((2.300 48.855, 2.330 48.855, 2.330 48.870, 2.300 48.870, 2.300 48.855))"),
    ("Quartier Gare",    1, "POLYGON((2.340 48.862, 2.355 48.862, 2.355 48.872, 2.340 48.872, 2.340 48.862))"),
    ("Zone Commerciale", 1, "POLYGON((2.345 48.856, 2.362 48.856, 2.362 48.864, 2.345 48.864, 2.345 48.856))"),
    ("Résidentiel A",    4, "POLYGON((2.315 48.878, 2.335 48.878, 2.335 48.888, 2.315 48.888, 2.315 48.878))"),
    ("Résidentiel B",    4, "POLYGON((2.365 48.878, 2.385 48.878, 2.385 48.888, 2.365 48.888, 2.365 48.878))"),
    ("Zone Industrielle",5, "POLYGON((2.390 48.845, 2.420 48.845, 2.420 48.862, 2.390 48.862, 2.390 48.845))"),
    ("Parc & Loisirs",   5, "POLYGON((2.310 48.848, 2.330 48.848, 2.330 48.858, 2.310 48.858, 2.310 48.848))"),
    ("Périphérie",       5, "POLYGON((2.295 48.840, 2.330 48.840, 2.330 48.850, 2.295 48.850, 2.295 48.840))"),
]

# bbox (lon_min, lon_max, lat_min, lat_max) dérivée directement des polygones ci-dessus
ZONE_BBOX = [
    (2.330, 2.360, 48.860, 48.875),
    (2.330, 2.360, 48.875, 48.890),
    (2.330, 2.360, 48.845, 48.860),
    (2.360, 2.390, 48.855, 48.870),
    (2.300, 2.330, 48.855, 48.870),
    (2.340, 2.355, 48.862, 48.872),
    (2.345, 2.362, 48.856, 48.864),
    (2.315, 2.335, 48.878, 48.888),
    (2.365, 2.385, 48.878, 48.888),
    (2.390, 2.420, 48.845, 48.862),
    (2.310, 2.330, 48.848, 48.858),
    (2.295, 2.330, 48.840, 48.850),
]

# ── Users ─────────────────────────────────────────────────────────────────────
DEMO_PASSWORD = "Password1!"
USERS = [
    ("admin@ecotrack.fr",           "Admin ECOTRACK",     "ADMIN"),
    ("gestionnaire@ecotrack.fr",    "Marie Dupont",       "MANAGER"),
    ("agent1@ecotrack.fr",          "Pierre Martin",      "AGENT"),
    ("agent2@ecotrack.fr",          "Sophie Bernard",     "AGENT"),
    ("citoyen1@ecotrack.fr",        "Jean Citoyen",       "CITIZEN"),
    ("citoyen2@ecotrack.fr",        "Lucie Citoyenne",    "CITIZEN"),
]

CONTAINER_TYPES = ["GENERAL", "RECYCLABLE", "ORGANIC", "GLASS"]
CONTAINERS_TOTAL = 100


def _random_point_in_bbox(bbox):
    lon_min, lon_max, lat_min, lat_max = bbox
    return (
        round(random.uniform(lon_min, lon_max), 6),
        round(random.uniform(lat_min, lat_max), 6),
    )


def _fill_profile(hours: int) -> list[int]:
    """Génère un profil de remplissage réaliste sur N heures."""
    base = random.randint(5, 40)
    rate = random.uniform(1.5, 4.5)   # % / heure
    noise = 1.5
    levels = []
    current = float(base)
    for _ in range(hours):
        current = min(100.0, current + rate + random.uniform(-noise, noise))
        levels.append(max(0, int(current)))
    return levels


async def seed(session: AsyncSession) -> None:
    now = datetime.now(timezone.utc)

    # ── Zones ──────────────────────────────────────────────────────────────
    log.info("Seeding zones...")
    zone_ids: list[uuid.UUID] = []
    for name, priority, wkt in ZONES:
        existing = await session.execute(
            text("SELECT id FROM zones WHERE name = :name"), {"name": name}
        )
        row = existing.fetchone()
        if row:
            zone_ids.append(row[0])
            continue
        zid = uuid.uuid4()
        await session.execute(
            text("""
                INSERT INTO zones (id, name, priority, geom)
                VALUES (:id, :name, :priority, ST_GeomFromText(:wkt, 4326))
            """),
            {"id": zid, "name": name, "priority": priority, "wkt": wkt},
        )
        zone_ids.append(zid)
    await session.commit()
    log.info(f"Zones: {len(zone_ids)}")

    # ── Users ──────────────────────────────────────────────────────────────
    log.info("Seeding users...")
    pw_hash = bcrypt.hash(DEMO_PASSWORD)
    for email, full_name, role in USERS:
        existing = await session.execute(
            text("SELECT id FROM users WHERE email = :email"), {"email": email}
        )
        if existing.fetchone():
            continue
        await session.execute(
            text("""
                INSERT INTO users (id, email, password_hash, full_name, role, status)
                VALUES (:id, :email, :hash, :name, :role, 'ACTIVE')
            """),
            {"id": uuid.uuid4(), "email": email, "hash": pw_hash,
             "name": full_name, "role": role},
        )
    await session.commit()
    log.info("Users: 6")

    # ── Containers ─────────────────────────────────────────────────────────
    log.info("Seeding containers...")
    existing_count = (await session.execute(text("SELECT COUNT(*) FROM containers"))).scalar()
    if existing_count and existing_count >= CONTAINERS_TOTAL:
        log.info(f"Containers already seeded ({existing_count}), skipping.")
    else:
        container_ids: list[uuid.UUID] = []
        # Répartition : ~8 conteneurs par zone, ajuster pour atteindre 100
        per_zone = CONTAINERS_TOTAL // len(ZONES)
        remainder = CONTAINERS_TOTAL % len(ZONES)

        cid_counter = 1
        for i, (zone_id, bbox) in enumerate(zip(zone_ids, ZONE_BBOX)):
            count = per_zone + (1 if i < remainder else 0)
            for _ in range(count):
                lng, lat = _random_point_in_bbox(bbox)
                cid = uuid.uuid4()
                qr = f"CNT-{cid_counter:06d}"
                ctype = random.choice(CONTAINER_TYPES)
                capacity = random.choice([500, 750, 1000, 1500])
                await session.execute(
                    text("""
                        INSERT INTO containers
                            (id, zone_id, qr_code, type, capacity_l, geom, status)
                        VALUES
                            (:id, :zone_id, :qr, :type, :cap,
                             ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                             'UNKNOWN')
                    """),
                    {"id": cid, "zone_id": zone_id, "qr": qr,
                     "type": ctype, "cap": capacity, "lng": lng, "lat": lat},
                )
                container_ids.append(cid)
                cid_counter += 1

        await session.commit()
        log.info(f"Containers: {len(container_ids)}")

        # ── Measurements (24h d'historique) ────────────────────────────────
        log.info("Seeding measurements...")
        HOURS = 24
        batch = []
        for cid in container_ids:
            levels = _fill_profile(HOURS)
            for h, level in enumerate(levels):
                measured_at = now - timedelta(hours=HOURS - h)
                batch.append({
                    "id":           uuid.uuid4(),
                    "container_id": cid,
                    "fill_level":   level,
                    "temperature":  round(random.uniform(15.0, 38.0), 1),
                    "battery":      random.randint(30, 100),
                    "source":       "seed",
                    "measured_at":  measured_at,
                })

        # Insertion par lots de 500
        for i in range(0, len(batch), 500):
            chunk = batch[i:i + 500]
            await session.execute(
                text("""
                    INSERT INTO iot_measurements
                        (id, container_id, fill_level, temperature, battery, source, measured_at)
                    VALUES
                        (:id, :container_id, :fill_level, :temperature, :battery, :source, :measured_at)
                """),
                chunk,
            )
        await session.commit()

        # Mise à jour fill_level_latest + status sur chaque conteneur
        await session.execute(text("""
            UPDATE containers c
            SET
                fill_level_latest = m.fill_level,
                last_measured_at  = m.measured_at,
                status = CASE
                    WHEN m.fill_level >= 90 THEN 'CRITICAL'
                    WHEN m.fill_level >= 70 THEN 'WATCH'
                    ELSE 'NORMAL'
                END::container_status
            FROM (
                SELECT DISTINCT ON (container_id)
                    container_id, fill_level, measured_at
                FROM iot_measurements
                ORDER BY container_id, measured_at DESC
            ) m
            WHERE c.id = m.container_id
        """))
        await session.commit()
        log.info(f"Measurements: {len(batch)}")

    log.info("Seed completed.")


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        await seed(session)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
