-- Users
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    role          VARCHAR(30) NOT NULL CHECK (role IN ('CITIZEN','AGENT','MANAGER','ADMIN')),
    status        VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- Zones
CREATE TABLE IF NOT EXISTS zones (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(120) NOT NULL,
    priority   INTEGER NOT NULL DEFAULT 1,
    geom       GEOMETRY(POLYGON, 4326) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_zones_geom ON zones USING GIST (geom);

-- Containers
CREATE TABLE IF NOT EXISTS containers (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id            UUID REFERENCES zones(id),
    qr_code            VARCHAR(80) UNIQUE NOT NULL,
    type               VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    capacity_l         INTEGER NOT NULL DEFAULT 1000,
    geom               GEOMETRY(POINT, 4326) NOT NULL,
    status             VARCHAR(30) NOT NULL DEFAULT 'UNKNOWN',
    fill_level_latest  INTEGER CHECK (fill_level_latest BETWEEN 0 AND 100),
    last_measured_at   TIMESTAMP,
    created_at         TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_containers_geom   ON containers USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_containers_zone   ON containers (zone_id);
CREATE INDEX IF NOT EXISTS idx_containers_status ON containers (status);

-- IoT measurements
CREATE TABLE IF NOT EXISTS iot_measurements (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_id UUID NOT NULL REFERENCES containers(id),
    fill_level   INTEGER NOT NULL CHECK (fill_level BETWEEN 0 AND 100),
    temperature  NUMERIC(5,2),
    battery      INTEGER CHECK (battery BETWEEN 0 AND 100),
    source       VARCHAR(50) NOT NULL DEFAULT 'simulator',
    measured_at  TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_iot_container_time ON iot_measurements (container_id, measured_at DESC);

-- Reports (citizen/agent signals)
CREATE TABLE IF NOT EXISTS reports (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id),
    container_id UUID NOT NULL REFERENCES containers(id),
    type         VARCHAR(30) NOT NULL CHECK (type IN ('FULL','DAMAGED','BLOCKED','OTHER')),
    status       VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CONFIRMED','RESOLVED','REJECTED')),
    comment      TEXT,
    created_at   TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reports_container ON reports (container_id, created_at DESC);

-- Routes (tournées)
CREATE TABLE IF NOT EXISTS routes (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id            UUID REFERENCES zones(id),
    agent_id           UUID REFERENCES users(id),
    scheduled_date     DATE NOT NULL,
    status             VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
                           CHECK (status IN ('DRAFT','ASSIGNED','IN_PROGRESS','DONE','CANCELLED')),
    estimated_distance NUMERIC(10,2),
    created_by         UUID REFERENCES users(id),
    created_at         TIMESTAMP NOT NULL DEFAULT now()
);

-- Route steps
CREATE TABLE IF NOT EXISTS route_steps (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id     UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    container_id UUID NOT NULL REFERENCES containers(id),
    step_order   INTEGER NOT NULL,
    status       VARCHAR(30) NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING','DONE','SKIPPED','ISSUE')),
    collected_at TIMESTAMP,
    volume_l     INTEGER,
    UNIQUE (route_id, step_order)
);

-- Points events (gamification)
CREATE TABLE IF NOT EXISTS points_events (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id),
    source     VARCHAR(80) NOT NULL,
    points     INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id      UUID REFERENCES users(id),
    action        VARCHAR(80) NOT NULL,
    resource_type VARCHAR(60),
    resource_id   UUID,
    ip            VARCHAR(45),
    details       JSONB,
    created_at    TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs (actor_id, created_at DESC);
