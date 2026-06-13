"""
Seed script — idempotent.
Crée : 12 zones, 6 users, 100 conteneurs, ~2400 mesures 24h.
Usage : python3 scripts/seed.py  (depuis /app dans le container)
"""
import asyncio
import os
import random
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from urllib.parse import quote_plus

# ── Config ────────────────────────────────────────────────────────────────────

def _db_url() -> str:
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    db   = os.getenv("POSTGRES_DB", "ecotrack")
    user = os.getenv("POSTGRES_USER", "ecotrack")
    pwd  = quote_plus(os.getenv("POSTGRES_PASSWORD", "change_me"))
    return f"postgresql+asyncpg://{user}:{pwd}@{host}:{port}/{db}"


ZONES = [
    ("a1000000-0000-0000-0000-000000000001", "Centre-Ville",     1,
     "POLYGON((2.330 48.860, 2.360 48.860, 2.360 48.875, 2.330 48.875, 2.330 48.860))"),
    ("a1000000-0000-0000-0000-000000000002", "Nord",             2,
     "POLYGON((2.330 48.875, 2.360 48.875, 2.360 48.890, 2.330 48.890, 2.330 48.875))"),
    ("a1000000-0000-0000-0000-000000000003", "Sud",              2,
     "POLYGON((2.330 48.845, 2.360 48.845, 2.360 48.860, 2.330 48.860, 2.330 48.845))"),
    ("a1000000-0000-0000-0000-000000000004", "Est",              3,
     "POLYGON((2.360 48.855, 2.390 48.855, 2.390 48.870, 2.360 48.870, 2.360 48.855))"),
    ("a1000000-0000-0000-0000-000000000005", "Ouest",            3,
     "POLYGON((2.300 48.855, 2.330 48.855, 2.330 48.870, 2.300 48.870, 2.300 48.855))"),
    ("a1000000-0000-0000-0000-000000000006", "Quartier Gare",    1,
     "POLYGON((2.340 48.862, 2.355 48.862, 2.355 48.872, 2.340 48.872, 2.340 48.862))"),
    ("a1000000-0000-0000-0000-000000000007", "Zone Commerciale", 1,
     "POLYGON((2.345 48.856, 2.362 48.856, 2.362 48.864, 2.345 48.864, 2.345 48.856))"),
    ("a1000000-0000-0000-0000-000000000008", "Résidentiel A",    4,
     "POLYGON((2.315 48.878, 2.335 48.878, 2.335 48.888, 2.315 48.888, 2.315 48.878))"),
    ("a1000000-0000-0000-0000-000000000009", "Résidentiel B",    4,
     "POLYGON((2.365 48.878, 2.385 48.878, 2.385 48.888, 2.365 48.888, 2.365 48.878))"),
    ("a1000000-0000-0000-0000-000000000010", "Zone Industrielle",5,
     "POLYGON((2.390 48.845, 2.420 48.845, 2.420 48.862, 2.390 48.862, 2.390 48.845))"),
    ("a1000000-0000-0000-0000-000000000011", "Parc & Loisirs",   5,
     "POLYGON((2.310 48.848, 2.330 48.848, 2.330 48.858, 2.310 48.858, 2.310 48.848))"),
    ("a1000000-0000-0000-0000-000000000012", "Périphérie",       5,
     "POLYGON((2.295 48.840, 2.330 48.840, 2.330 48.850, 2.295 48.850, 2.295 48.840))"),
]

# bbox per zone (lng_min, lat_min, lng_max, lat_max) derived from ZONES polygons
ZONE_BBOX = {
    "a1000000-0000-0000-0000-000000000001": (2.330, 48.860, 2.360, 48.875),
    "a1000000-0000-0000-0000-000000000002": (2.330, 48.875, 2.360, 48.890),
    "a1000000-0000-0000-0000-000000000003": (2.330, 48.845, 2.360, 48.860),
    "a1000000-0000-0000-0000-000000000004": (2.360, 48.855, 2.390, 48.870),
    "a1000000-0000-0000-0000-000000000005": (2.300, 48.855, 2.330, 48.870),
    "a1000000-0000-0000-0000-000000000006": (2.340, 48.862, 2.355, 48.872),
    "a1000000-0000-0000-0000-000000000007": (2.345, 48.856, 2.362, 48.864),
    "a1000000-0000-0000-0000-000000000008": (2.315, 48.878, 2.335, 48.888),
    "a1000000-0000-0000-0000-000000000009": (2.365, 48.878, 2.385, 48.888),
    "a1000000-0000-0000-0000-000000000010": (2.390, 48.845, 2.420, 48.862),
    "a1000000-0000-0000-0000-000000000011": (2.310, 48.848, 2.330, 48.858),
    "a1000000-0000-0000-0000-000000000012": (2.295, 48.840, 2.330, 48.850),
}

PASSWORD_HASH = bcrypt.hashpw(
    b"Password1!", bcrypt.gensalt(rounds=10)
).decode()

USERS = [
    ("b1000000-0000-0000-0000-000000000001",
     "admin@ecotrack.fr", "Admin ECOTRACK", "ADMIN"),
    ("b1000000-0000-0000-0000-000000000002",
     "gestionnaire@ecotrack.fr", "Marie Dupont", "MANAGER"),
    ("b1000000-0000-0000-0000-000000000003",
     "agent1@ecotrack.fr", "Pierre Martin", "AGENT"),
    ("b1000000-0000-0000-0000-000000000004",
     "agent2@ecotrack.fr", "Sophie Bernard", "AGENT"),
    ("b1000000-0000-0000-0000-000000000005",
     "citoyen1@ecotrack.fr", "Jean Citoyen", "CITIZEN"),
    ("b1000000-0000-0000-0000-000000000006",
     "citoyen2@ecotrack.fr", "Lucie Citoyenne", "CITIZEN"),
]


def _fill_profile(hours: int = 24) -> list[int]:
    base = random.randint(5, 40)
    rate = random.uniform(1.5, 4.5)
    levels = []
    for h in range(hours):
        noise = random.uniform(-2, 2)
        val = base + rate * h + noise
        levels.append(max(0, min(100, round(val))))
    return levels


async def main() -> None:
    engine = create_async_engine(_db_url(), echo=False)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with factory() as session:
        # ── Zones ─────────────────────────────────────────────────────────────
        for zone_id, name, priority, wkt in ZONES:
            row = await session.execute(
                text("SELECT id FROM zones WHERE id = :id"),
                {"id": zone_id},
            )
            if row.first():
                continue
            await session.execute(text("""
                INSERT INTO zones (id, name, priority, geom)
                VALUES (
                    :id, :name, :priority,
                    ST_SetSRID(ST_GeomFromText(:wkt), 4326)
                )
            """), {"id": zone_id, "name": name, "priority": priority, "wkt": wkt})
        await session.commit()
        print(f"✓ {len(ZONES)} zones")

        # ── Users ─────────────────────────────────────────────────────────────
        for uid, email, full_name, role in USERS:
            row = await session.execute(
                text("SELECT id FROM users WHERE id = :id"), {"id": uid}
            )
            if row.first():
                continue
            await session.execute(text("""
                INSERT INTO users (id, email, password_hash, full_name, role, status)
                VALUES (:id, :email, :ph, :fn, :role, 'ACTIVE')
            """), {"id": uid, "email": email, "ph": PASSWORD_HASH,
                   "fn": full_name, "role": role})
        await session.commit()
        print(f"✓ {len(USERS)} users (password: Password1!)")

        # ── Containers ────────────────────────────────────────────────────────
        cnt_count = await session.execute(
            text("SELECT COUNT(*) FROM containers")
        )
        existing = cnt_count.scalar_one()
        if existing >= 100:
            print(f"✓ {existing} containers already present — skipping")
        else:
            zone_ids = list(ZONE_BBOX.keys())
            containers = []
            for i in range(100):
                zid = zone_ids[i % len(zone_ids)]
                lng_min, lat_min, lng_max, lat_max = ZONE_BBOX[zid]
                lat = round(random.uniform(lat_min, lat_max), 6)
                lng = round(random.uniform(lng_min, lng_max), 6)
                cid = str(uuid.uuid4())
                qr = f"CNT-{i+1:06d}"
                containers.append((cid, zid, qr, lat, lng))
                await session.execute(text("""
                    INSERT INTO containers
                        (id, zone_id, qr_code, type, capacity_l, geom, status)
                    VALUES (
                        :id, :zone_id, :qr, 'GENERAL', 1000,
                        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                        'UNKNOWN'
                    )
                    ON CONFLICT (qr_code) DO NOTHING
                """), {"id": cid, "zone_id": zid, "qr": qr,
                       "lat": lat, "lng": lng})
            await session.commit()
            print(f"✓ {len(containers)} containers")

        # ── Measurements ──────────────────────────────────────────────────────
        meas_count = await session.execute(
            text("SELECT COUNT(*) FROM iot_measurements")
        )
        if meas_count.scalar_one() >= 2000:
            print("✓ measurements already present — skipping")
        else:
            rows = await session.execute(
                text("SELECT id FROM containers ORDER BY qr_code")
            )
            container_ids = [str(r[0]) for r in rows.fetchall()]
            now = datetime.now(timezone.utc)
            batch = []
            HOURS = 24
            for cid in container_ids:
                levels = _fill_profile(HOURS)
                for h, fill in enumerate(levels):
                    ts = now - timedelta(hours=HOURS - h)
                    batch.append({
                        "id": str(uuid.uuid4()),
                        "container_id": cid,
                        "fill_level": fill,
                        "measured_at": ts.replace(tzinfo=None),
                        "source": "simulator",
                    })
                    if len(batch) >= 500:
                        await session.execute(text("""
                            INSERT INTO iot_measurements
                                (id, container_id, fill_level, measured_at, source)
                            VALUES (:id, :container_id, :fill_level, :measured_at, :source)
                        """), batch)
                        await session.commit()
                        batch = []
            if batch:
                await session.execute(text("""
                    INSERT INTO iot_measurements
                        (id, container_id, fill_level, measured_at, source)
                    VALUES (:id, :container_id, :fill_level, :measured_at, :source)
                """), batch)
                await session.commit()
            total_m = await session.execute(
                text("SELECT COUNT(*) FROM iot_measurements")
            )
            print(f"✓ {total_m.scalar_one()} measurements")

            # Update containers with latest fill + status
            await session.execute(text("""
                UPDATE containers c
                SET
                    fill_level_latest = m.fill_level,
                    last_measured_at  = m.measured_at,
                    status = CASE
                        WHEN m.fill_level >= 90 THEN 'CRITICAL'::container_status
                        WHEN m.fill_level >= 70 THEN 'WATCH'::container_status
                        ELSE 'NORMAL'::container_status
                    END
                FROM (
                    SELECT DISTINCT ON (container_id)
                        container_id, fill_level, measured_at
                    FROM iot_measurements
                    ORDER BY container_id, measured_at DESC
                ) m
                WHERE c.id = m.container_id
            """))
            await session.commit()
            print("✓ container statuses updated")

    await engine.dispose()
    print("\n✅ Seed terminé.")


if __name__ == "__main__":
    asyncio.run(main())
