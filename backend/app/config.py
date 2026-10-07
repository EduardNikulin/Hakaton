# backend/app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/ecocity"
    SECRET_KEY: str = "super-secret-key-for-hackathon-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Радиус поиска жалоб для автодетектора инцидентов (метры)
    incident_detection_radius_meters: int = 1000
    # Минимум жалоб в радиусе за окно, чтобы сработал детектор
    incident_complaints_threshold: int = 3
    # Окно поиска жалоб для детектора (часы)
    incident_detection_window_hours: int = 1
    # Окно усреднения замеров и подсчета жалоб для ECI (часы)
    eci_window_hours: int = 24

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()