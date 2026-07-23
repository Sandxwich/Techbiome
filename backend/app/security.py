from dataclasses import dataclass
from enum import Enum

from litestar import Request
from litestar.exceptions import HTTPException

from app.config import settings


class Role(str, Enum):
    user = "user"
    developer = "developer"


@dataclass(frozen=True)
class Identity:
    email: str
    role: Role


def _normalize_header_name(header_name: str) -> str:
    return header_name.strip().lower()


def _require_trusted_proxy(request: Request) -> None:
    expected_secret = settings.trusted_proxy_secret
    if not expected_secret:
        return

    presented_secret = request.headers.get("x-internal-auth")
    if presented_secret != expected_secret:
        raise HTTPException(status_code=403, detail="Untrusted origin")


def _parse_role(raw_role: str | None) -> Role | None:
    if not raw_role:
        return None

    normalized = raw_role.strip().lower()
    if normalized == Role.user.value:
        return Role.user
    if normalized == Role.developer.value:
        return Role.developer
    return None


def get_identity(request: Request) -> Identity:
    _require_trusted_proxy(request)

    email_header = _normalize_header_name(settings.identity_email_header)
    role_header = _normalize_header_name(settings.identity_role_header)
    email = request.headers.get(email_header)
    role = _parse_role(request.headers.get(role_header))

    if settings.security_mode == "enforced":
        if not email:
            raise HTTPException(status_code=401, detail="Missing authenticated identity header")
        if role is None:
            raise HTTPException(status_code=403, detail="Missing or invalid role header")
        return Identity(email=email, role=role)

    # Local development fallback.
    return Identity(email=email or "local-dev@techbiome.local", role=role or Role.developer)


def require_role(request: Request, *allowed_roles: Role) -> Identity:
    identity = get_identity(request)
    if identity.role not in allowed_roles:
        allowed = ", ".join(sorted(role.value for role in allowed_roles))
        raise HTTPException(status_code=403, detail=f"Role '{identity.role.value}' is not allowed. Expected: {allowed}")
    return identity
