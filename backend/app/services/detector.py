# backend/app/services/detector.py
"""Правило автодетекции инцидента (без БД, только логика):
аномалия датчика И минимум N жалоб в радиусе за окно времени."""

# Пороги аномалий по метрике: (min_норма, max_норма).
# Значение ВНЕ диапазона считается аномалией. Ключи - нижний регистр.
ANOMALY_LIMITS = {
    "pm25": (0.0, 55.0),    # мкг/м3, примерно ВОЗ 24h
    "pm2.5": (0.0, 55.0),
    "pm10": (0.0, 150.0),
    "no2": (0.0, 100.0),
    "ph": (6.0, 9.0),       # вода: вне 6-9 считаем опасным
}


def is_anomaly(metric_name: str, value: float) -> bool:
    """Проверяет, выходит ли значение метрики за допустимый диапазон."""
    limits = ANOMALY_LIMITS.get(metric_name.lower())
    if limits is None:
        return False
    low, high = limits
    return value < low or value > high


def compute_confidence(complaints_in_radius: int, threshold: int) -> float:
    """Уверенность детектора 0..100: база 60 + 10 за каждую жалобу сверх порога."""
    bonus = max(0, complaints_in_radius - threshold) * 10
    return float(min(60.0 + bonus + (threshold - 1) * 5.0, 99.0))