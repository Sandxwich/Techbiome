# Architecture

Techbiome is a device-monitoring platform built around four moving parts:

- The React frontend in [frontend/src](../frontend/src) presents the dashboard, device view, logs, and settings page.
- The Litestar backend in [backend/app](../backend/app) exposes the REST API.
- PostgreSQL stores devices, telemetry, commands, firmware, alert rules, alert instances, and logs.
- The MQTT bridge and alert worker run in the background and keep the database in sync with device activity.

## Request Flow

1. A user opens the frontend in the browser.
2. The frontend calls the REST API for device counts, device lists, logs, telemetry history, commands, alerts, and firmware.
3. Devices publish telemetry and status to MQTT.
4. The MQTT bridge polls the queued commands table, marks queued commands as delivered, and writes operational logs.
5. The alert worker reads the latest telemetry, evaluates alert rules, and creates or resolves alert instances.

## Why the workers exist

The API is intentionally thin. It handles CRUD, query endpoints, and command/firmware queuing, but it does not sit in a long-running broker loop. The workers handle the continuous processes that would otherwise block web requests:

- `app/workers/mqtt_bridge.py` turns queued commands into delivered commands and records what happened.
- `app/workers/alert_worker.py` continuously evaluates alert rules against telemetry.

## Notes on the current implementation

- The backend creates tables on startup for MVP/local use in [backend/app/main.py](../backend/app/main.py).
- Telemetry ingestion marks the related device as online and updates its `last_seen` timestamp.
- The frontend uses fake sensor data on the dashboard today, so it is a presentation layer over the live device/log pages rather than a full live telemetry consumer.

## Related References

- [backend/README.md](../backend/README.md)
- [frontend/README.md](../frontend/README.md)
- [docs/data-model.md](data-model.md)
- [docs/c4/index.c4](c4/index.c4)
