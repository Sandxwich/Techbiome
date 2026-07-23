from litestar import Controller, Request, get
from sqlalchemy import desc, select

from app.db.models import LogEntry
from app.db.session import SessionLocal
from app.security import Role, require_role


def _serialize_log(entry: LogEntry) -> dict:
    return {
        "id": entry.id,
        "device_id": entry.device_id,
        "level": entry.level,
        "source": entry.source,
        "message": entry.message,
        "timestamp": entry.timestamp.isoformat(),
    }


class LogController(Controller):
    path = "/logs"

    @get()
    def list_logs(
        self,
        request: Request,
        device_id: str | None = None,
        level: str | None = None,
        source: str | None = None,
        limit: int = 200,
    ) -> list[dict]:
        require_role(request, Role.user, Role.developer)
        safe_limit = min(max(limit, 1), 1000)
        with SessionLocal() as session:
            stmt = select(LogEntry)
            if device_id:
                stmt = stmt.where(LogEntry.device_id == device_id)
            if level:
                stmt = stmt.where(LogEntry.level == level)
            if source:
                stmt = stmt.where(LogEntry.source == source)

            rows = session.execute(stmt.order_by(desc(LogEntry.timestamp)).limit(safe_limit)).scalars().all()
            return [_serialize_log(row) for row in rows]
