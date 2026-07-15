# Data Model

These are the main persisted entities in the backend.

## Devices

Stored in `devices`.

- Primary identifier: `id`
- Unique hardware identifier: `serial`
- Type: `device_type`
- Operational state: `status`
- Last seen timestamp: `last_seen`
- Optional JSON metadata: `metadata`

This table is the anchor for the rest of the system.

## Telemetry

Stored in `telemetry`.

- Belongs to a device through `device_id`
- Stores `timestamp` for the device event time
- Stores `received_at` for ingestion time
- Stores the raw `payload` as JSON

Telemetry is append-only and the latest record is what powers the current-state views.

## Commands

Stored in `commands`.

- Belongs to a device through `device_id`
- Has a `type` such as an OTA update or a device command
- Stores an optional JSON `payload`
- Tracks `status`, `created_at`, and `delivered_at`

Commands are queued by the API and later marked delivered by the MQTT bridge worker.

## Firmware

Stored in `firmware`.

- Version and target `device_type`
- `storage_key` for the object in MinIO or another blob store
- `checksum` for validation
- `uploaded_at` timestamp

Deploying firmware queues OTA commands for one or more devices.

## Alert Rules and Alert Instances

Stored in `alert_rules` and `alert_instances`.

- A rule describes the metric, operator, threshold, and severity.
- A rule may be device-specific or global.
- An alert instance records that a rule was triggered for a device.
- `resolved_at` is null while the alert is active.

The alert worker continuously checks the latest telemetry against these rules.

## Logs

Stored in `logs`.

- Optional `device_id`
- Log `level`
- `source` such as `mqtt-bridge` or `alert-worker`
- Human-readable `message`
- `timestamp`

Logs provide the operational history for the bridge, alert worker, and device-related actions.
