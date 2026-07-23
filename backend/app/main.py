from litestar import Litestar

from app.api.alerts import AlertController
from app.api.certificates import DeviceCertificateController
from app.api.commands import CommandController
from app.api.devices import DeviceController
from app.api.firmware import FirmwareController
from app.api.health import health
from app.api.logs import LogController
from app.api.telemetry import TelemetryController
from app.db.models import Base
from app.db.session import engine


# Create tables at startup for MVP/local development.
Base.metadata.create_all(bind=engine)


app = Litestar(
    route_handlers=[
        health,
        DeviceController,
        DeviceCertificateController,
        TelemetryController,
        CommandController,
        FirmwareController,
        AlertController,
        LogController,
    ]
)
