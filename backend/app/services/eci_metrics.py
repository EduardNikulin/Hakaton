# backend/app/services/eci_metrics.py
"""Единый расчёт входных метрик ECI района.

Используется и фоновым пересчётом (tasks/eci_calculator.py), и панелью района
(repositories/district_repository.py), чтобы расклад компонентов в UI совпадал
с итоговым ECI на карте.
"""
from datetime import timedelta

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import utcnow
from app.models.feedback import Report
from app.models.sensors import Sensor, SensorMeasurement

# Источники метрик — единый список для всех запросов
PM25_METRICS = ("pm25", "pm2.5")
PH_METRICS = ("ph",)


async def _avg_measurement(
    db: AsyncSession, district_id: int, metrics: tuple, since, until=None
) -> float | None:
    """Среднее значение метрик по датчикам района за окно [since, until)."""
    query = (
        select(func.avg(SensorMeasurement.value))
        .join(Sensor, Sensor.id == SensorMeasurement.sensor_id)
        .where(
            Sensor.district_id == district_id,
            func.lower(SensorMeasurement.metric_name).in_(metrics),
            SensorMeasurement.created_at >= since,
        )
    )
    if until is not None:
        query = query.where(SensorMeasurement.created_at < until)
    result = await db.execute(query)
    return result.scalar()


async def district_eci_inputs(
    db: AsyncSession, district_id: int, window_hours: int
) -> dict:
    """Собирает входные метрики ECI района за окно window_hours.

    Возвращает avg_pm25, avg_ph, prev_pm25, trend, complaints.
    """
    since = utcnow() - timedelta(hours=window_hours)
    prev_since = since - timedelta(hours=window_hours)

    avg_pm25 = await _avg_measurement(db, district_id, PM25_METRICS, since)
    avg_ph = await _avg_measurement(db, district_id, PH_METRICS, since)
    prev_pm25 = await _avg_measurement(
        db, district_id, PM25_METRICS, prev_since, until=since
    )

    if avg_pm25 is not None and prev_pm25 is not None:
        trend = prev_pm25 - avg_pm25
    else:
        trend = 0.0

    # ДОБАВЛЕНО: жалобы только за окно (а не за всё время) —
    # старые жалобы перестают вечно давить citizen_score.
    complaints = await db.scalar(
        select(func.count(Report.id)).where(
            Report.district_id == district_id,
            Report.status != "RESOLVED",
            Report.created_at >= since,
        )
    ) or 0

    return {
        "avg_pm25": avg_pm25,
        "avg_ph": avg_ph,
        "prev_pm25": prev_pm25,
        "trend": trend,
        "complaints": complaints,
    }