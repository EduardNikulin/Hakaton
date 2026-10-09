# simulator/scenarios.py
"""Сценарии замеров: сколько отдавать в зависимости от режима.

normal   - фоновый шум вокруг базового уровня (кормит ECI);
incident - аномальный всплеск (проверка детектора инцидентов);
recovery - возвращение к норме после инцидента.
"""
import random

from config import BASE_LEVELS


def normal_value(metric: str) -> tuple[float, str]:
    """Фоновый замер: шум вокруг базового уровня, качество OK."""
    base = BASE_LEVELS[metric]
    if metric == "ph":
        return round(base + random.uniform(-0.4, 0.4), 2), "OK"
    return round(base * random.uniform(0.65, 1.35), 2), "OK"


def incident_value(metric: str) -> tuple[float, str]:
    """Аномальный всплеск: воздух 110-150 (выше порогов и pm25=55, и no2=100), вода pH < 6 (ниже порога 6)."""

    if metric == "ph":
        return round(random.uniform(4.5, 5.8), 2), "ANOMALY"
    return round(random.uniform(110.0, 150.0), 2), "ANOMALY"


def recovery_value(metric: str) -> tuple[float, str]:
    """Восстановление: чуть выше нормы, качество SUSPECT."""
    base = BASE_LEVELS[metric]
    if metric == "ph":
        return round(base + random.uniform(-0.8, 0.8), 2), "SUSPECT"
    return round(base * random.uniform(1.2, 1.8), 2), "SUSPECT"


SCENARIOS = {
    "normal": normal_value,
    "incident": incident_value,
    "recovery": recovery_value,
}
