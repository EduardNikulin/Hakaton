# backend/app/services/eci.py
"""Расчёт индекса качества среды ECI.

Направление индекса: ВЫШЕ = ЛУЧШЕ (72.5 - чисто, 48.5 - плохо).
Функции чистые: никаких запросов к базе, только математика.
"""

# Пороги цвета: score -> hex (совпадают с цветом демо-сида)
GREEN = "#22c55e"
YELLOW = "#f59e0b"
RED = "#ef4444"

# Веса компонентов индекса в сумме дают 1.0
WEIGHT_AIR = 0.40
WEIGHT_WATER = 0.25
WEIGHT_CITIZEN = 0.25
WEIGHT_TREND = 0.10


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    """Ограничивает значение диапазоном [low, high]."""
    return max(low, min(high, value))


def air_score(pm25: float) -> float:
    """Качество воздуха по PM2.5 (мкг/м3): 10 -> 100 баллов, 90 -> 0."""
    return _clamp(100.0 - (pm25 - 10.0) * 1.25)


def water_score(ph: float) -> float:
    """Качество воды по pH: норма 6.5-8.5 -> 100 баллов, штраф за отклонение."""
    deviation = max(0.0, abs(ph - 7.5) - 1.0)
    return _clamp(100.0 - deviation * 40.0)


def citizen_score(complaints: int) -> float:
    """Активность жалоб: 0 жалоб -> 100, каждая жалоба -12 баллов."""
    return _clamp(100.0 - complaints * 12.0)


def trend_score(trend: float) -> float:
    """Динамика воздуха: trend = (среднее PM2.5 вчера - сегодня).
    Положительный trend = воздух улучшается -> выше балл. Нейтрально = 50."""
    return _clamp(50.0 + trend * 5.0)


def eci_color(score: float) -> str:
    """Подбирает цвет района по итоговому баллу."""
    if score >= 75:
        return GREEN
    if score >= 50:
        return YELLOW
    return RED


def compute_eci(air: float, water: float, citizen: int, trend: float) -> tuple[float, str]:
    """Считает итоговый ECI из сырых метрик района.

    air   - среднее PM2.5 за окно (мкг/м3);
    water - средний pH за окно;
    citizen - число нерешенных жалоб района;
    trend - динамика PM2.5 (предыдущее окно минус текущее).
    Возвращает (score 0..100, color_hex).
    """
    score = (
        air_score(air) * WEIGHT_AIR
        + water_score(water) * WEIGHT_WATER
        + citizen_score(citizen) * WEIGHT_CITIZEN
        + trend_score(trend) * WEIGHT_TREND
    )
    score = round(_clamp(score), 1)
    return score, eci_color(score)