from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./techbiome.db"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    mqtt_bridge_interval: int = 2
    alert_worker_interval: int = 5
    mqtt_host: str = "mqtt-broker"
    mqtt_port: int = 1883
    mqtt_username: str | None = None
    mqtt_password: str | None = None
    mqtt_use_tls: bool = False
    mqtt_ca_file: str | None = None
    mqtt_cert_file: str | None = None
    mqtt_key_file: str | None = None
    mqtt_topic_prefix: str = "devices"
    security_mode: str = "permissive"
    trusted_proxy_secret: str | None = None
    identity_email_header: str = "cf-access-authenticated-user-email"
    identity_role_header: str = "x-auth-request-role"
    alert_webhook_url: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
