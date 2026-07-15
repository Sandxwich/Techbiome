from datetime import datetime, timezone

from litestar import Controller, delete, get, post, put
from litestar.exceptions import HTTPException
from sqlalchemy import func, select

from app.db.models import Device
from app.db.session import SessionLocal


def _serialize_device(device: Device) -> dict:
    return {
        "id": device.id,
        "serial": device.serial,
        "device_type": device.device_type,
        "firmware_version": device.firmware_version,
        "last_seen": device.last_seen.isoformat() if device.last_seen else None,
        "status": device.status,
        "metadata": device.metadata_json or {},
    }


class DeviceController(Controller):
    path = "/devices"

    @get()
    def list_devices(self, status: str | None = None, q: str | None = None) -> list[dict]:
        with SessionLocal() as session:
            stmt = select(Device)
            if status:
                stmt = stmt.where(Device.status == status)
            if q:
                like = f"%{q}%"
                stmt = stmt.where((Device.serial.ilike(like)) | (Device.device_type.ilike(like)))
            rows = session.execute(stmt.order_by(Device.serial.asc())).scalars().all()
            return [_serialize_device(d) for d in rows]

    @get("/count")
    def count_devices(self) -> dict[str, int]:
        with SessionLocal() as session:
            total = session.execute(select(func.count(Device.id))).scalar_one()
            return {"count": int(total)}

    @get("/{device_id:str}")
    def get_device(self, device_id: str) -> dict:
        with SessionLocal() as session:
            device = session.get(Device, device_id)
            if not device:
                raise HTTPException(status_code=404, detail="Device not found")
            return _serialize_device(device)

    @post()
    def create_device(self, data: dict) -> dict:
        required_fields = ["serial", "device_type"]
        for field in required_fields:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing field: {field}")

        device = Device(
            serial=data["serial"],
            device_type=data["device_type"],
            firmware_version=data.get("firmware_version"),
            status=data.get("status", "provisioning"),
            metadata_json=data.get("metadata") or {},
            last_seen=datetime.now(timezone.utc),
        )
        with SessionLocal() as session:
            session.add(device)
            session.commit()
            session.refresh(device)
            return _serialize_device(device)

    @put("/{device_id:str}")
    def update_device(self, device_id: str, data: dict) -> dict:
        with SessionLocal() as session:
            device = session.get(Device, device_id)
            if not device:
                raise HTTPException(status_code=404, detail="Device not found")

            for field in ["serial", "device_type", "firmware_version", "status"]:
                if field in data:
                    setattr(device, field, data[field])

            if "metadata" in data:
                device.metadata_json = data["metadata"] or {}

            if data.get("seen_now"):
                device.last_seen = datetime.now(timezone.utc)

            session.add(device)
            session.commit()
            session.refresh(device)
            return _serialize_device(device)

    @delete("/{device_id:str}")
    def delete_device(self, device_id: str) -> dict[str, bool]:
        with SessionLocal() as session:
            device = session.get(Device, device_id)
            if not device:
                raise HTTPException(status_code=404, detail="Device not found")
            session.delete(device)
            session.commit()
            return {"deleted": True}
