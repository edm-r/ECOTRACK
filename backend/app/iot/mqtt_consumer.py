import asyncio
import json
import logging
import threading
import time
from typing import Optional

import paho.mqtt.client as mqtt

log = logging.getLogger(__name__)

TOPIC = "ecotrack/measurements"


class MQTTConsumer:
    def __init__(self, host: str, port: int) -> None:
        self.host = host
        self.port = port
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._client: Optional[mqtt.Client] = None
        self._thread: Optional[threading.Thread] = None
        self._running = False

    def start(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop
        self._running = True
        self._thread = threading.Thread(target=self._run, daemon=True, name="mqtt-consumer")
        self._thread.start()

    def stop(self) -> None:
        self._running = False
        if self._client:
            try:
                self._client.disconnect()
            except Exception:
                pass

    def _on_connect(self, client: mqtt.Client, userdata, flags, rc) -> None:
        if rc == 0:
            log.info("MQTT broker connected — subscribing to %s QoS=1", TOPIC)
            client.subscribe(TOPIC, qos=1)
        else:
            log.error("MQTT connect failed rc=%d", rc)

    def _on_message(self, client: mqtt.Client, userdata, msg: mqtt.MQTTMessage) -> None:
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            log.warning("MQTT bad payload on %s: %s", msg.topic, exc)
            return
        if self._loop and self._loop.is_running():
            asyncio.run_coroutine_threadsafe(self._handle(payload), self._loop)

    async def _handle(self, payload: dict) -> None:
        from app.db.session import AsyncSessionLocal
        from app.schemas.iot import MeasurementIn
        from app.services.iot_ingest import ingest_measurement
        try:
            data = MeasurementIn(**payload)
            async with AsyncSessionLocal() as db:
                await ingest_measurement(data, db)
        except Exception as exc:
            log.error("MQTT ingest error: %s", exc)

    def _run(self) -> None:
        delay = 1
        while self._running:
            try:
                client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
                client.on_connect = self._on_connect
                client.on_message = self._on_message
                self._client = client
                client.connect(self.host, self.port, keepalive=60)
                client.loop_forever()
            except Exception as exc:
                if not self._running:
                    break
                log.warning("MQTT disconnected: %s — reconnecting in %ds", exc, delay)
                time.sleep(delay)
                delay = min(delay * 2, 60)


_consumer: Optional[MQTTConsumer] = None


def get_consumer() -> MQTTConsumer:
    global _consumer
    if _consumer is None:
        from app.core.config import settings
        _consumer = MQTTConsumer(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT)
    return _consumer
