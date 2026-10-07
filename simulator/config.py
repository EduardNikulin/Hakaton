# simulator/config.py
"""Настройки симулятора датчиков: адрес API, уровни метрик, тайминги."""
import os

from dotenv import load_dotenv

# Читаем .env из папки simulator/ (файл лежит рядом с этим модулем)
load_dotenv()

# Базовый адрес backend API
API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000/api/v1")

# Тайминги по умолчанию
SEND_INTERVAL_SECONDS = float(os.getenv("SIM_INTERVAL", "1.0"))
REQUEST_TIMEOUT_SECONDS = 10.0

# Базовые уровни метрик: фоновый шум строится вокруг них
BASE_LEVELS = {
    "pm25": 25.0,   # мкг/м3
    "no2": 40.0,    # мкг/м3
    "ph": 7.4,      # вода
}

# Воздушные датчики генерируют воздушные метрики, водяные - pH
AIR_METRICS = ("pm25", "no2")
WATER_METRICS = ("ph",)
