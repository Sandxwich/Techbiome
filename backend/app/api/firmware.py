from litestar import Controller, get, post
from litestar.exceptions import HTTPException
from sqlalchemy import desc, select

from app.db.models import Command, Device, Firmware
from app.db.session import SessionLocal


def _serialize_firmware(item: Firmware) -> dict:
    return {
        "id": item.id,
        "version": item.version,
        "device_type": item.device_type,
        "storage_key": item.storage_key,
        "checksum": item.checksum,
        "uploaded_at": item.uploaded_at.isoformat(),
    }


class FirmwareController(Controller):
    path = "/firmware"

    @get()
    def list_firmware(self) -> list[dict]:
        with SessionLocal() as session:
            stmt = select(Firmware).order_by(desc(Firmware.uploaded_at))
            rows = session.execute(stmt).scalars().all()
            return [_serialize_firmware(item) for item in rows]

    @post()
    def create_firmware(self, data: dict) -> dict:
        required = ["version", "device_type", "storage_key", "checksum"]
        for field in required:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing field: {field}")

        item = Firmware(
            version=data["version"],
            device_type=data["device_type"],
            storage_key=data["storage_key"],
            checksum=data["checksum"],
        )
        with SessionLocal() as session:
            session.add(item)
            session.commit()
            session.refresh(item)
            return _serialize_firmware(item)

    @post("/{firmware_id:str}/deploy")
    def deploy_firmware(self, firmware_id: str, data: dict) -> dict:
        with SessionLocal() as session:
            firmware = session.get(Firmware, firmware_id)
            if not firmware:
                raise HTTPException(status_code=404, detail="Firmware not found")

            device_ids = data.get("device_ids")
            if not isinstance(device_ids, list) or not device_ids:
                raise HTTPException(status_code=400, detail="device_ids must be a non-empty array")

            devices = session.execute(select(Device).where(Device.id.in_(device_ids))).scalars().all()
            found_ids = {device.id for device in devices}
            missing = [device_id for device_id in device_ids if device_id not in found_ids]
            if missing:
                raise HTTPException(status_code=404, detail=f"Unknown devices: {', '.join(missing)}")

            for device_id in device_ids:
                ota_command = Command(
                    device_id=device_id,
                    type="ota_update",
                    payload={
                        "firmware_id": firmware.id,
                        "version": firmware.version,
                        "storage_key": firmware.storage_key,
                        "checksum": firmware.checksum,
                    },
                    status="queued",
                )
                session.add(ota_command)

            session.commit()
            return {
                "queued": len(device_ids),
                "firmware_id": firmware.id,
                "version": firmware.version,
            }
