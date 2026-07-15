from datetime import datetime


def iso_or_none(value: datetime | None) -> str | None:
    return value.isoformat() if value else None
