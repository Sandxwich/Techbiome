from datetime import datetime, timezone

from litestar import Controller, get, post
from litestar.exceptions import HTTPException
from sqlalchemy import desc, select

from app.db.models import Device, Telemetry
from app.db.session import SessionLocal


def _serialize_telemetry(row: Telemetry) -> dict:
    return {
        "id": row.id,
        "device_id": row.device_id,
        "timestamp": row.timestamp.isoformat(),
        "received_at": row.received_at.isoformat(),
        "payload": row.payload,
    }


class TelemetryController(Controller):
    path = "/telemetry"

    @get("/{device_id:str}")
    def latest(self, device_id: str) -> dict:
        with SessionLocal() as session:
            stmt = (
                select(Telemetry)
                .where(Telemetry.device_id == device_id)
                .order_by(desc(Telemetry.timestamp))
                .limit(1)
            )
            row = session.execute(stmt).scalars().first()
            if not row:
                raise HTTPException(status_code=404, detail="No telemetry found")
            return _serialize_telemetry(row)

    @get("/{device_id:str}/history")
    def history(self, device_id: str, limit: int = 100) -> list[dict]:
        safe_limit = min(max(limit, 1), 1000)
        with SessionLocal() as session:
            stmt = (
                select(Telemetry)
                .where(Telemetry.device_id == device_id)
                .order_by(desc(Telemetry.timestamp))
                .limit(safe_limit)
            )
            rows = session.execute(stmt).scalars().all()
            return [_serialize_telemetry(r) for r in rows]

    @post("/{device_id:str}")
    def ingest(self, device_id: str, data: dict) -> dict:
        payload = data.get("payload")
        if not isinstance(payload, dict):
            raise HTTPException(status_code=400, detail="payload must be an object")

        ts = data.get("timestamp")
        timestamp = datetime.now(timezone.utc)
        if isinstance(ts, str):
            timestamp = datetime.fromisoformat(ts)

        with SessionLocal() as session:
            device = session.get(Device, device_id)
            if not device:
                raise HTTPException(status_code=404, detail="Device not found")

            row = Telemetry(device_id=device_id, timestamp=timestamp, payload=payload)
            device.last_seen = datetime.now(timezone.utc)
            device.status = "online"
            session.add(row)
            session.add(device)
            session.commit()
            session.refresh(row)
            return _serialize_telemetry(row)
