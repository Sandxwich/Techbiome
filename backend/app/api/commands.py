from litestar import Controller, Request, get, post
from litestar.exceptions import HTTPException
from sqlalchemy import desc, select

from app.db.models import Command, Device
from app.db.session import SessionLocal
from app.security import Role, require_role


def _serialize_command(command: Command) -> dict:
    return {
        "id": command.id,
        "device_id": command.device_id,
        "type": command.type,
        "payload": command.payload or {},
        "status": command.status,
        "created_at": command.created_at.isoformat(),
        "delivered_at": command.delivered_at.isoformat() if command.delivered_at else None,
    }


class CommandController(Controller):
    path = "/devices/{device_id:str}/commands"

    @get()
    def list_commands(self, request: Request, device_id: str) -> list[dict]:
        require_role(request, Role.user, Role.developer)
        with SessionLocal() as session:
            stmt = (
                select(Command)
                .where(Command.device_id == device_id)
                .order_by(desc(Command.created_at))
                .limit(200)
            )
            rows = session.execute(stmt).scalars().all()
            return [_serialize_command(row) for row in rows]

    @post()
    def queue_command(self, request: Request, device_id: str, data: dict) -> dict:
        require_role(request, Role.developer)
        command_type = data.get("type")
        if not command_type:
            raise HTTPException(status_code=400, detail="Missing field: type")

        with SessionLocal() as session:
            if not session.get(Device, device_id):
                raise HTTPException(status_code=404, detail="Device not found")

            command = Command(
                device_id=device_id,
                type=command_type,
                payload=data.get("payload") or {},
                status="queued",
            )
            session.add(command)
            session.commit()
            session.refresh(command)
            return _serialize_command(command)
