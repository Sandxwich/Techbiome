import asyncio
import json
from datetime import datetime, timezone
from urllib import request as urlrequest

from sqlalchemy import and_, select

from app.config import settings
from app.db.models import AlertInstance, AlertRule, LogEntry, Telemetry
from app.db.session import SessionLocal


def evaluate(operator: str, value: float, threshold: float) -> bool:
    if operator == "gt":
        return value > threshold
    if operator == "lt":
        return value < threshold
    if operator == "eq":
        return value == threshold
    if operator == "neq":
        return value != threshold
    return False


def _send_webhook(payload: dict) -> None:
    if not settings.alert_webhook_url:
        return

    body = json.dumps(payload).encode("utf-8")
    req = urlrequest.Request(
        settings.alert_webhook_url,
        data=body,
        method="POST",
        headers={"Content-Type": "application/json", "User-Agent": "techbiome-alert-worker/1.0"},
    )
    try:
        with urlrequest.urlopen(req, timeout=5):
            return
    except Exception:
        return


async def run_alert_worker() -> None:
    while True:
        with SessionLocal() as session:
            rules = session.execute(select(AlertRule)).scalars().all()
            for rule in rules:
                telemetry_stmt = select(Telemetry).order_by(Telemetry.timestamp.desc())
                if rule.device_id:
                    telemetry_stmt = telemetry_stmt.where(Telemetry.device_id == rule.device_id)
                telemetry = session.execute(telemetry_stmt.limit(1)).scalars().first()
                if not telemetry:
                    continue

                metric_value = telemetry.payload.get(rule.metric)
                if metric_value is None:
                    continue

                value = float(metric_value)
                triggered = evaluate(rule.operator, value, rule.threshold)

                active_stmt = select(AlertInstance).where(
                    and_(
                        AlertInstance.rule_id == rule.id,
                        AlertInstance.device_id == telemetry.device_id,
                        AlertInstance.resolved_at.is_(None),
                    )
                )
                active_alert = session.execute(active_stmt).scalars().first()

                if triggered and active_alert is None:
                    alert = AlertInstance(rule_id=rule.id, device_id=telemetry.device_id, value=value)
                    session.add(alert)
                    session.add(
                        LogEntry(
                            device_id=telemetry.device_id,
                            level=rule.severity,
                            source="alert-worker",
                            message=f"Alert triggered for rule {rule.id}",
                        )
                    )
                    _send_webhook(
                        {
                            "event": "alert.triggered",
                            "rule_id": rule.id,
                            "device_id": telemetry.device_id,
                            "severity": rule.severity,
                            "value": value,
                            "threshold": rule.threshold,
                            "operator": rule.operator,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        }
                    )

                if not triggered and active_alert is not None:
                    active_alert.resolved_at = datetime.now(timezone.utc)
                    session.add(active_alert)
                    session.add(
                        LogEntry(
                            device_id=telemetry.device_id,
                            level="info",
                            source="alert-worker",
                            message=f"Alert resolved for rule {rule.id}",
                        )
                    )
                    _send_webhook(
                        {
                            "event": "alert.resolved",
                            "rule_id": rule.id,
                            "device_id": telemetry.device_id,
                            "severity": rule.severity,
                            "value": value,
                            "threshold": rule.threshold,
                            "operator": rule.operator,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        }
                    )

            session.commit()

        await asyncio.sleep(settings.alert_worker_interval)


def main() -> None:
    asyncio.run(run_alert_worker())


if __name__ == "__main__":
    main()
