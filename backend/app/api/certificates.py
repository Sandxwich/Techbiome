import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from litestar import Controller, Request, get, post
from litestar.exceptions import HTTPException
from sqlalchemy import select

from app.db.models import Device, DeviceCertificate
from app.db.session import SessionLocal
from app.security import Role, require_role


def _serialize_certificate(cert: DeviceCertificate) -> dict:
    return {
        "id": cert.id,
        "device_id": cert.device_id,
        "common_name": cert.common_name,
        "serial_number": cert.serial_number,
        "fingerprint_sha256": cert.fingerprint_sha256,
        "issued_at": cert.issued_at.isoformat(),
        "not_after": cert.not_after.isoformat(),
        "revoked_at": cert.revoked_at.isoformat() if cert.revoked_at else None,
        "revocation_reason": cert.revocation_reason,
    }


class DeviceCertificateController(Controller):
    path = "/devices/{device_id:str}/certificates"

    @get()
    def list_certificates(self, request: Request, device_id: str) -> list[dict]:
        require_role(request, Role.user, Role.developer)
        with SessionLocal() as session:
            if not session.get(Device, device_id):
                raise HTTPException(status_code=404, detail="Device not found")

            certs = session.execute(
                select(DeviceCertificate)
                .where(DeviceCertificate.device_id == device_id)
                .order_by(DeviceCertificate.issued_at.desc())
            ).scalars().all()
            return [_serialize_certificate(cert) for cert in certs]

    @post("/issue")
    def issue_certificate(self, request: Request, device_id: str, data: dict) -> dict:
        require_role(request, Role.developer)
        validity_days = int(data.get("validity_days", 365))
        if validity_days < 1 or validity_days > 3650:
            raise HTTPException(status_code=400, detail="validity_days must be between 1 and 3650")

        with SessionLocal() as session:
            device = session.get(Device, device_id)
            if not device:
                raise HTTPException(status_code=404, detail="Device not found")

            issued_at = datetime.now(timezone.utc)
            serial_number = secrets.token_hex(16)
            fingerprint_material = f"{device.id}:{serial_number}:{issued_at.isoformat()}"
            fingerprint = hashlib.sha256(fingerprint_material.encode("utf-8")).hexdigest()

            cert = DeviceCertificate(
                device_id=device.id,
                common_name=data.get("common_name") or f"device/{device.serial}",
                serial_number=serial_number,
                fingerprint_sha256=fingerprint,
                issued_at=issued_at,
                not_after=issued_at + timedelta(days=validity_days),
            )
            session.add(cert)
            session.commit()
            session.refresh(cert)
            return _serialize_certificate(cert)

    @post("/{certificate_id:str}/revoke")
    def revoke_certificate(
        self, request: Request, device_id: str, certificate_id: str, data: dict
    ) -> dict:
        require_role(request, Role.developer)
        reason = str(data.get("reason", "unspecified")).strip()[:255]

        with SessionLocal() as session:
            cert = session.get(DeviceCertificate, certificate_id)
            if not cert or cert.device_id != device_id:
                raise HTTPException(status_code=404, detail="Certificate not found")
            if cert.revoked_at is not None:
                return _serialize_certificate(cert)

            cert.revoked_at = datetime.now(timezone.utc)
            cert.revocation_reason = reason
            session.add(cert)
            session.commit()
            session.refresh(cert)
            return _serialize_certificate(cert)
