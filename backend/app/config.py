# backend/app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/ecocity"
    SECRET_KEY: str = "super-secret-key-for-hackathon-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    
    # Явно объявляем поле, чтобы Pydantic его распознал
    incident_detection_radius_meters: int = 1000

    # Настройки конфигурации для Pydantic v2
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"  # Игнорировать любые лишние переменные в .env, чтобы не было падений
    )

settings = Settings()
