import asyncio
import json
import ssl
from datetime import datetime, timezone

import aiomqtt
from sqlalchemy import select

from app.config import settings
from app.db.models import Command, Device, LogEntry, Telemetry
from app.db.session import SessionLocal


def _build_tls_context() -> ssl.SSLContext | None:
    if not settings.mqtt_use_tls:
        return None

    context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
    if settings.mqtt_ca_file:
        context.load_verify_locations(cafile=settings.mqtt_ca_file)
    if settings.mqtt_cert_file and settings.mqtt_key_file:
        context.load_cert_chain(certfile=settings.mqtt_cert_file, keyfile=settings.mqtt_key_file)
    return context


def _topic(topic_suffix: str) -> str:
    return f"{settings.mqtt_topic_prefix}/{topic_suffix}"


def _parse_topic(topic: str) -> tuple[str, str] | None:
    parts = topic.split("/")
    if len(parts) != 3:
        return None
    if parts[0] != settings.mqtt_topic_prefix:
        return None
    return parts[1], parts[2]


def _process_telemetry(device_id: str, payload: dict) -> None:
    with SessionLocal() as session:
        device = session.get(Device, device_id)
        if not device:
            session.add(
                LogEntry(
                    device_id=None,
                    level="warning",
                    source="mqtt-bridge",
                    message=f"Dropped telemetry for unknown device {device_id}",
                )
            )
            session.commit()
            return

        ts = payload.get("timestamp")
        timestamp = datetime.now(timezone.utc)
        if isinstance(ts, str):
            try:
                timestamp = datetime.fromisoformat(ts)
            except ValueError:
                timestamp = datetime.now(timezone.utc)

        telemetry_payload = payload.get("payload") if isinstance(payload.get("payload"), dict) else payload
        row = Telemetry(device_id=device_id, timestamp=timestamp, payload=telemetry_payload)
        device.last_seen = datetime.now(timezone.utc)
        device.status = "online"

        session.add(row)
        session.add(device)
        session.add(
            LogEntry(
                device_id=device_id,
                level="info",
                source="mqtt-bridge",
                message="Telemetry message persisted",
            )
        )
        session.commit()


def _process_status(device_id: str, payload: dict | str) -> None:
    with SessionLocal() as session:
        device = session.get(Device, device_id)
        if not device:
            return

        if isinstance(payload, dict):
            status = str(payload.get("status") or "online")
        else:
            status = str(payload)

        device.status = status
        device.last_seen = datetime.now(timezone.utc)
        session.add(device)
        session.add(
            LogEntry(
                device_id=device_id,
                level="info",
                source="mqtt-bridge",
                message=f"Status update received: {status}",
            )
        )
        session.commit()


async def _subscribe_device_topics(client: aiomqtt.Client) -> None:
    await client.subscribe(_topic("+/telemetry"), qos=1)
    await client.subscribe(_topic("+/status"), qos=1)

    async for message in client.messages:
        parsed = _parse_topic(str(message.topic))
        if not parsed:
            continue

        device_id, message_type = parsed
        body_text = message.payload.decode("utf-8", errors="ignore")
        try:
            body = json.loads(body_text)
        except json.JSONDecodeError:
            body = body_text

        if message_type == "telemetry" and isinstance(body, dict):
            _process_telemetry(device_id, body)
        elif message_type == "status":
            _process_status(device_id, body)


async def _deliver_queued_commands(client: aiomqtt.Client) -> None:
    while True:
        with SessionLocal() as session:
            queued = (
                session.execute(select(Command).where(Command.status == "queued").limit(100))
                .scalars()
                .all()
            )
            for command in queued:
                command_payload = {
                    "id": command.id,
                    "type": command.type,
                    "payload": command.payload or {},
                    "created_at": command.created_at.isoformat(),
                }
                await client.publish(
                    _topic(f"{command.device_id}/commands"),
                    json.dumps(command_payload),
                    qos=1,
                    retain=True,
                )

                command.status = "delivered"
                command.delivered_at = datetime.now(timezone.utc)
                session.add(command)

                log = LogEntry(
                    device_id=command.device_id,
                    level="info",
                    source="mqtt-bridge",
                    message=f"Delivered command {command.id} ({command.type})",
                )
                session.add(log)
            session.commit()

        await asyncio.sleep(settings.mqtt_bridge_interval)


async def run_bridge() -> None:
    tls_context = _build_tls_context()
    while True:
        try:
            async with aiomqtt.Client(
                hostname=settings.mqtt_host,
                port=settings.mqtt_port,
                username=settings.mqtt_username,
                password=settings.mqtt_password,
                tls_context=tls_context,
            ) as client:
                subscriber = asyncio.create_task(_subscribe_device_topics(client))
                deliverer = asyncio.create_task(_deliver_queued_commands(client))
                done, pending = await asyncio.wait(
                    {subscriber, deliverer}, return_when=asyncio.FIRST_EXCEPTION
                )
                for task in pending:
                    task.cancel()
                for task in done:
                    task.result()
        except Exception as exc:  # pragma: no cover - defensive reconnect path
            with SessionLocal() as session:
                session.add(
                    LogEntry(
                        device_id=None,
                        level="error",
                        source="mqtt-bridge",
                        message=f"Bridge reconnect after error: {exc}",
                    )
                )
                session.commit()
            await asyncio.sleep(2)


def main() -> None:
    asyncio.run(run_bridge())


if __name__ == "__main__":
    main()
