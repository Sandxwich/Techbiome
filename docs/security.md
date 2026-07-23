# Security Features

This document describes the security architecture currently modeled in [docs/c4/index.c4](c4/index.c4) and how it should be operated.

## Security Goals

- Expose only the web UI entrypoint to the public internet.
- Keep backend services private by default.
- Allow device connectivity only with certificate-based trust.
- Maintain auditable security events and revocation capability.

## Trust Boundaries

1. Internet Edge: Cloudflare public domain and edge protections.
2. Origin Edge: Caddy reverse proxy as the only public origin.
3. Private App Network: REST API, workers, broker, and database network.
4. Device Trust Boundary: Device CA and certificate-authenticated device sessions.

## Ingress and Exposure Model

- Publicly reachable:
  - Cloudflare domain for the UI.
  - Caddy origin endpoint (restricted to Cloudflare ingress).
- Not publicly reachable:
  - Litestar REST API listener.
  - PostgreSQL.
  - Worker processes.
  - Internal broker and storage admin surfaces.

### Allowed Internet Path

1. User or developer accesses the Cloudflare domain over HTTPS.
2. Cloudflare forwards approved traffic to Caddy.
3. Caddy serves frontend assets and proxies API requests on /api.
4. API remains private and is not directly internet routable.

## Access Control Rollout

### Step 1: Cloudflare Access Login Gate

Require authentication at Cloudflare Access before any request reaches Caddy.

- Integrate Cloudflare Access with an identity provider (OIDC/SAML).
- Require a valid user session for app domain access.
- Forward trusted identity headers from Cloudflare to the origin.
- Restrict Caddy origin ingress to Cloudflare only.

### Step 2: Role Separation (User vs Developer)

Enforce role-based authorization in the API using trusted identity claims.

Role scope:

- user
  - Read dashboards, devices, telemetry, and logs.
  - No firmware deploy, certificate lifecycle, or sensitive command actions.
- developer
  - All user permissions.
  - Firmware upload/deploy, alert-rule write access, sensitive commands, and certificate issue/revoke operations.

Implementation note:

- Enforce roles server-side in the API, not only in frontend navigation.

## Device Identity and Certificates

Techbiome uses a private device CA (self-signed root) for device identity.

- Each managed device should have a unique client certificate.
- Devices trust a pinned CA certificate for backend identity.
- MQTT sessions use mutual TLS and require valid client certificates.
- Compromised device certificates can be revoked.

### Important Rule

Do not hardcode one shared client certificate/key across all devices.
Use a unique key pair and certificate per device.

## API Access Policy

- UI/API calls are expected to flow through Caddy only.
- Direct public access to API listeners must be blocked by network policy.
- Identity and role claims are accepted only from trusted Cloudflare-originated headers.
- Certificate issuance and revocation actions are handled by the Device Service.

## Current Implementation Status

- Implemented:
  - Role checks on API endpoints (`user` for read, `developer` for write).
  - Trusted proxy secret gate (`X-Internal-Auth`) to avoid spoofed role headers.
  - Configurable identity headers (`CF-Access-Authenticated-User-Email`, `X-Auth-Request-Role`).
  - Device certificate lifecycle records (issue/list/revoke API endpoints).
  - Optional alert webhooks for trigger/resolve state changes.
  - Hardened deployment file: `docker-compose.secure.yml` with private app network and Caddy edge gateway.

- Still your responsibility to operate safely:
  - Run behind Cloudflare Access (or equivalent identity-aware proxy).
  - Provide real MQTT certificates and CA rotation process.
  - Keep CA private keys protected/offline.
  - Restrict home router port forwarding to only 80/443 (and 8883 if devices connect from outside your LAN).

## Secure Deployment Quickstart

1. Set environment variables: `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`, `TRUSTED_PROXY_SECRET`.
2. Add MQTT TLS files under `secrets/mqtt/` (`ca.crt`, `server.crt`, `server.key`).
3. Start secure stack:

   ```powershell
   docker compose -f docker-compose.secure.yml up --build -d
   ```

4. Configure Cloudflare Access to inject:
  - `CF-Access-Authenticated-User-Email`
  - `X-Auth-Request-Role` (`user` or `developer`)
5. Keep `SECURITY_MODE=enforced` in production.

## Developer Provisioning Guidance

For development or small-scale provisioning, SSH can be used as a bootstrap transport, but it should not be the long-term trust model.

Preferred pattern:

1. Register device in Techbiome.
2. Generate short-lived enrollment token.
3. Place token on device through SSH or physical bootstrap channel.
4. Device generates key locally and submits CSR.
5. Techbiome signs and returns device certificate chain.
6. Device starts mTLS channels using issued credentials.

## Operational Hardening Checklist

- Cloudflare
  - Enable WAF and DDoS protections.
  - Restrict origin access to Cloudflare egress IP ranges where possible.
- Caddy
  - Enforce HTTPS and HSTS.
  - Add strict security headers.
  - Enable request logging and rate limiting.
- API and network
  - Bind API to private network interfaces.
  - Deny direct public ingress with firewall/security group rules.
- Device PKI
  - Maintain CA rotation and revocation processes.
  - Keep CA private key offline or in a protected key store.
- Data layer
  - Restrict database access to API/workers only.
  - Audit privileged operations.

## Related C4 Views

- [Security Architecture view](c4/index.c4)
- [User Access view](c4/index.c4)
- [Developer Access view](c4/index.c4)
- [Device Access view](c4/index.c4)
