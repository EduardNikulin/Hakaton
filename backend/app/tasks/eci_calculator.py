# backend/app/tasks/eci_calculator.py
"""Пересчёт ECI всех районов: агрегирует замеры и жалобы из БД,
обновляет District.eci_score/color_hex, пишет историю в EcoIndexHistory."""

from datetime import timedelta

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.config import settings
from app.database import utcnow
from app.models.core import District
from app.models.feedback import Report
from app.models.sensors import EcoIndexHistory, Sensor, SensorMeasurement
from app.services.eci import compute_eci

# Варианты написания метрик в замерах (исторически разные)
PM25_METRICS = ("pm25", "pm2.5")
PH_METRICS = ("ph",)


async def _avg_measurement(db: AsyncSession, district_id: int, metrics: tuple, since, until=None) -> float | None:
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


async def recalculate_all_districts(db: AsyncSession) -> list[dict]:
    """Пересчитывает ECI для каждого района. Возвращает сводку для ответа API."""
    since = utcnow() - timedelta(hours=settings.eci_window_hours)
    prev_since = since - timedelta(hours=settings.eci_window_hours)

    result = await db.execute(select(District).order_by(District.id))
    districts = result.scalars().all()

    summary = []
    for district in districts:
        # 1. Среднее PM2.5 и pH за текущее окно
        avg_pm25 = await _avg_measurement(db, district.id, PM25_METRICS, since)
        avg_ph = await _avg_measurement(db, district.id, PH_METRICS, since)

        # 2. Trend: среднее PM2.5 предыдущего окна минус текущего (падение загрязнения = плюс)
        prev_pm25 = await _avg_measurement(
            db, district.id, PM25_METRICS, prev_since, until=since
        )
        if avg_pm25 is not None and prev_pm25 is not None:
            trend = prev_pm25 - avg_pm25
        else:
            trend = 0.0

        # 3. Число нерешенных жалоб района
        complaints_result = await db.execute(
            select(func.count(Report.id)).where(
                Report.district_id == district.id,
                Report.status != "RESOLVED",
            )
        )
        complaints = complaints_result.scalar() or 0

        # 4. Итоговый балл и цвет (при отсутствии данных - нейтральные значения)
        score, color = compute_eci(
            air=avg_pm25 if avg_pm25 is not None else 10.0,
            water=avg_ph if avg_ph is not None else 7.5,
            citizen=complaints,
            trend=trend,
        )

        district.eci_score = score
        district.color_hex = color
        db.add(EcoIndexHistory(district_id=district.id, eci_score=score))

        summary.append({
            "district_id": district.id,
            "district": district.name,
            "eci_score": score,
            "color_hex": color,
            "avg_pm25": avg_pm25,
            "avg_ph": avg_ph,
            "complaints": complaints,
        })

    await db.commit()
    return summary
