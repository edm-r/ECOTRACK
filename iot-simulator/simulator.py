"""
IoT Simulator — génère des mesures de remplissage pour tous les conteneurs.
Mode MQTT (par défaut) ou fallback HTTP POST vers l'API.
"""
import json
import os
import random
import time
from datetime import datetime, timezone

import psycopg2
import paho.mqtt.client as mqtt

MQTT_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_BROKER_PORT", 1883))
INTERVAL  = int(os.getenv("IOT_SIMULATE_INTERVAL_SECONDS", 15))

DB_DSN = (
    f"host={os.getenv('POSTGRES_HOST','localhost')} "
    f"dbname={os.getenv('POSTGRES_DB','ecotrack')} "
    f"user={os.getenv('POSTGRES_USER','ecotrack')} "
    f"password={os.getenv('POSTGRES_PASSWORD','change_me')}"
)


def get_container_ids():
    conn = psycopg2.connect(DB_DSN)
    cur = conn.cursor()
    cur.execute("SELECT id, qr_code FROM containers WHERE status != 'MAINTENANCE'")
    rows = cur.fetchall()
    conn.close()
    return rows


def generate_measurement(container_id: str, qr_code: str) -> dict:
    return {
        "container_id": container_id,
        "qr_code":      qr_code,
        "fill_level":   random.randint(0, 100),
        "temperature":  round(random.uniform(15.0, 40.0), 1),
        "battery":      random.randint(20, 100),
        "measured_at":  datetime.now(timezone.utc).isoformat(),
        "source":       "simulator",
    }


def main():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
    client.loop_start()

    print(f"[simulator] Connected to MQTT {MQTT_HOST}:{MQTT_PORT} — interval={INTERVAL}s")

    while True:
        containers = get_container_ids()
        for cid, qr in containers:
            payload = generate_measurement(str(cid), qr)
            client.publish("ecotrack/measurements", json.dumps(payload), qos=1)

        print(f"[simulator] Published {len(containers)} measurements")
        time.sleep(INTERVAL)


if __name__ == "__main__":
    main()
