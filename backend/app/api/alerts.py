from datetime import datetime, timezone

from litestar import Controller, Request, delete, get, post, put
from litestar.exceptions import HTTPException
from sqlalchemy import and_, select

from app.db.models import AlertInstance, AlertRule
from app.db.session import SessionLocal
from app.security import Role, require_role


def _serialize_rule(rule: AlertRule) -> dict:
    return {
        "id": rule.id,
        "device_id": rule.device_id,
        "metric": rule.metric,
        "operator": rule.operator,
        "threshold": rule.threshold,
        "severity": rule.severity,
    }


def _serialize_alert(alert: AlertInstance) -> dict:
    return {
        "id": alert.id,
        "rule_id": alert.rule_id,
        "device_id": alert.device_id,
        "triggered_at": alert.triggered_at.isoformat(),
        "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None,
        "value": alert.value,
    }


class AlertController(Controller):
    path = "/alerts"

    @get()
    def list_active_alerts(self, request: Request, device_id: str | None = None) -> list[dict]:
        require_role(request, Role.user, Role.developer)
        with SessionLocal() as session:
            stmt = select(AlertInstance).where(AlertInstance.resolved_at.is_(None))
            if device_id:
                stmt = stmt.where(AlertInstance.device_id == device_id)
            rows = session.execute(stmt).scalars().all()
            return [_serialize_alert(row) for row in rows]

    @get("/rules")
    def list_rules(self, request: Request) -> list[dict]:
        require_role(request, Role.user, Role.developer)
        with SessionLocal() as session:
            rows = session.execute(select(AlertRule)).scalars().all()
            return [_serialize_rule(row) for row in rows]

    @post("/rules")
    def create_rule(self, request: Request, data: dict) -> dict:
        require_role(request, Role.developer)
        required = ["metric", "operator", "threshold"]
        for field in required:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing field: {field}")

        rule = AlertRule(
            device_id=data.get("device_id"),
            metric=data["metric"],
            operator=data["operator"],
            threshold=float(data["threshold"]),
            severity=data.get("severity", "warning"),
        )
        with SessionLocal() as session:
            session.add(rule)
            session.commit()
            session.refresh(rule)
            return _serialize_rule(rule)

    @put("/rules/{rule_id:str}")
    def update_rule(self, request: Request, rule_id: str, data: dict) -> dict:
        require_role(request, Role.developer)
        with SessionLocal() as session:
            rule = session.get(AlertRule, rule_id)
            if not rule:
                raise HTTPException(status_code=404, detail="Rule not found")

            for field in ["metric", "operator", "severity", "device_id"]:
                if field in data:
                    setattr(rule, field, data[field])
            if "threshold" in data:
                rule.threshold = float(data["threshold"])

            session.add(rule)
            session.commit()
            session.refresh(rule)
            return _serialize_rule(rule)

    @delete("/rules/{rule_id:str}")
    def delete_rule(self, request: Request, rule_id: str) -> dict[str, bool]:
        require_role(request, Role.developer)
        with SessionLocal() as session:
            rule = session.get(AlertRule, rule_id)
            if not rule:
                raise HTTPException(status_code=404, detail="Rule not found")
            session.delete(rule)
            session.commit()
            return {"deleted": True}

    @post("/simulate")
    def simulate(self, request: Request, data: dict) -> dict:
        require_role(request, Role.developer)
        required = ["rule_id", "device_id", "value"]
        for field in required:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing field: {field}")

        with SessionLocal() as session:
            rule = session.get(AlertRule, data["rule_id"])
            if not rule:
                raise HTTPException(status_code=404, detail="Rule not found")

            active_stmt = select(AlertInstance).where(
                and_(
                    AlertInstance.rule_id == rule.id,
                    AlertInstance.device_id == data["device_id"],
                    AlertInstance.resolved_at.is_(None),
                )
            )
            active = session.execute(active_stmt).scalars().first()

            value = float(data["value"])
            triggered = _evaluate(rule.operator, value, rule.threshold)

            if triggered and active is None:
                active = AlertInstance(rule_id=rule.id, device_id=data["device_id"], value=value)
                session.add(active)
            if not triggered and active is not None:
                active.resolved_at = datetime.now(timezone.utc)
                session.add(active)

            session.commit()
            return {
                "rule_id": rule.id,
                "device_id": data["device_id"],
                "triggered": triggered,
                "value": value,
            }


def _evaluate(operator: str, value: float, threshold: float) -> bool:
    if operator == "gt":
        return value > threshold
    if operator == "lt":
        return value < threshold
    if operator == "eq":
        return value == threshold
    if operator == "neq":
        return value != threshold
    raise HTTPException(status_code=400, detail=f"Unsupported operator: {operator}")
