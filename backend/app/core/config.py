from pathlib import Path
from typing import List
from urllib.parse import quote_plus

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Racine du projet = 3 niveaux au-dessus de ce fichier (core/app/backend/racine)
_ROOT = Path(__file__).parents[3]


class Settings(BaseSettings):
    # Database
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "ecotrack"
    POSTGRES_USER: str = "ecotrack"
    POSTGRES_PASSWORD: str = "change_me"

    @property
    def DATABASE_URL(self) -> str:
        pwd = quote_plus(self.POSTGRES_PASSWORD)
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{pwd}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # Auth
    SECRET_KEY: str = "change_me_please_use_32_chars_minimum"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_min_length(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError(
                "SECRET_KEY must be at least 32 characters. "
                "Generate one with: openssl rand -hex 32"
            )
        return v

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # MQTT
    MQTT_BROKER_HOST: str = "localhost"
    MQTT_BROKER_PORT: int = 1883

    # IoT service token (POST /iot/measurements)
    IOT_SERVICE_TOKEN: str = "dev-iot-token-change-in-production"

    model_config = SettingsConfigDict(
        env_file=str(_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
