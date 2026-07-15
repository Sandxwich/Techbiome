from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./techbiome.db"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    mqtt_bridge_interval: int = 2
    alert_worker_interval: int = 5

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
