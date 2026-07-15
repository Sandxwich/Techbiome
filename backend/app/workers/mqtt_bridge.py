import asyncio
from datetime import datetime, timezone

from sqlalchemy import select

from app.config import settings
from app.db.models import Command, LogEntry
from app.db.session import SessionLocal


async def run_bridge() -> None:
    while True:
        with SessionLocal() as session:
            queued = (
                session.execute(select(Command).where(Command.status == "queued").limit(100))
                .scalars()
                .all()
            )
            for command in queued:
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


def main() -> None:
    asyncio.run(run_bridge())


if __name__ == "__main__":
    main()
