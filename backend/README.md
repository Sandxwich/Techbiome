# Techbiome Backend

This package contains the Litestar API, SQLAlchemy models, and background workers that support Techbiome.

## What the backend does

- Exposes the REST API used by the frontend and external clients.
- Stores devices, telemetry, commands, firmware, alerts, and logs in the database.
- Runs the MQTT bridge worker to deliver queued commands and record operational logs.
- Runs the alert worker to evaluate alert rules against telemetry.

For the system-wide view, see [docs/architecture.md](../docs/architecture.md) and [docs/data-model.md](../docs/data-model.md).

## Included Services

- REST API (`app/main.py`)
- MQTT Bridge worker (`app/workers/mqtt_bridge.py`)
- Alert Worker (`app/workers/alert_worker.py`)
- SQLAlchemy models for:
  - devices
  - telemetry
  - commands
  - firmware
  - alert_rules + alert_instances
  - logs

## Runtime Notes

- The backend creates tables on startup in [app/main.py](app/main.py) for MVP/local development.
- Settings are loaded from environment variables or `.env` via [app/config.py](app/config.py).
- The default database URL falls back to SQLite, but Docker Compose uses PostgreSQL.

## API Endpoints

- `GET /health`
- Devices:
  - `GET /devices`
  - `GET /devices/count`
  - `GET /devices/{id}`
  - `POST /devices`
  - `PUT /devices/{id}`
  - `DELETE /devices/{id}`
- Telemetry:
  - `GET /telemetry/{id}`
  - `GET /telemetry/{id}/history`
  - `POST /telemetry/{id}`
- Commands:
  - `GET /devices/{id}/commands`
  - `POST /devices/{id}/commands`
- Firmware:
  - `GET /firmware`
  - `POST /firmware`
  - `POST /firmware/{id}/deploy`
- Alerts:
  - `GET /alerts`
  - `GET /alerts/rules`
  - `POST /alerts/rules`
  - `PUT /alerts/rules/{id}`
  - `DELETE /alerts/rules/{id}`
- Logs:
  - `GET /logs`

## Local Development

1. Create virtual environment and install dependencies:

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -e .[workers]
   ```

2. Configure environment:

   ```powershell
   copy .env.example .env
   ```

3. Run API:

   ```powershell
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. Run workers (separate terminals):

   ```powershell
   python -m app.workers.mqtt_bridge
   python -m app.workers.alert_worker
   ```

## Docker Compose (Whole Project)

From repository root:

```powershell
docker compose up --build
```

Services:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Postgres: localhost:5432
- MQTT Broker: localhost:1883
- MinIO API: http://localhost:9000
- MinIO Console: http://localhost:9001

Default credentials:

- Postgres user/password: `techbiome` / `techbiome`
- MinIO user/password: `techbiome` / `techbiome123`

## Endpoint Summary

The main API groups are documented here for quick reference:

- Health: `GET /health`
- Devices: list, count, create, update, delete, and fetch by id
- Telemetry: latest reading, history, ingest
- Commands: list and queue per device
- Firmware: list, create, and deploy
- Alerts: list active alerts, manage rules, simulate rule state changes
- Logs: list operational and device logs with filters
