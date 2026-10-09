# backend/app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Радиус поиска жалоб для автодетектора инцидентов (метры)
    incident_detection_radius_meters: int = 1000
    # Минимум жалоб в радиусе за окно, чтобы сработал детектор
    incident_complaints_threshold: int = 3
    # Окно поиска жалоб для детектора (часы)
    incident_detection_window_hours: int = 1
    # Окно усреднения замеров и подсчета жалоб для ECI (часы)
    eci_window_hours: int = 24
    # Период автопересчёта ECI (секунды). 0 или меньше - фоновый пересчёт выключен
    eci_recalc_interval_seconds: int = 0
    # Origin'ы фронтенда для CORS (через запятую)
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()
