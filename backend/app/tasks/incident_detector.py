# backend/app/tasks/incident_detector.py
"""Фоновая задача детекции инцидента после приёма замера.

Запускается через BackgroundTasks из POST /sensors/iot/measurements.
Правило: аномалия метрики И >= N жалоб в радиусе R за окно T.
Ищет жалобы через PostGIS ST_DWithin (расстояние по географии, метры).
"""

from datetime import timedelta

from geoalchemy2.types import Geography
from sqlalchemy import cast, func
from sqlalchemy.future import select

from app.config import settings
from app.database import AsyncSessionLocal, utcnow
from app.models.feedback import Report
from app.models.incidents import Incident
from app.models.sensors import Sensor
from app.services.detector import compute_confidence, is_anomaly


async def run_incident_detection(sensor_id: int, metric_name: str, value: float) -> None:
    """Точка входа для BackgroundTasks: проверяет замер и, возможно, создаёт инцидент.

    Сессию открывает свою: фоновые задачи выполняются ПОСЛЕ отправки ответа,
    когда запрос-сессия FastAPI уже закрыта.
    """
    # Быстрый выход без похода в базу, если значение нормальное
    if not is_anomaly(metric_name, value):
        return

    async with AsyncSessionLocal() as db:
        sensor_result = await db.execute(select(Sensor).where(Sensor.id == sensor_id))
        sensor = sensor_result.scalars().first()

        # Incident привязан к району (district_id NOT NULL) - без района инцидента не бывает
        if sensor is None or sensor.district_id is None:
            return

        # Дедупликация: по району уже есть открытый инцидент - новый не создаём
        existing = await db.execute(
            select(Incident.id).where(
                Incident.district_id == sensor.district_id,
                Incident.status != "RESOLVED",
            ).limit(1)
        )
        if existing.scalars().first():
            return

        # Жалобы за окно в радиусе от датчика (ST_DWithin по географии, метры)
        since = utcnow() - timedelta(hours=settings.incident_detection_window_hours)
        reports_result = await db.execute(
            select(Report)
            .join(Sensor, Sensor.id == sensor_id)
            .where(
                Report.created_at >= since,
                func.ST_DWithin(
                    cast(Report.location, Geography),
                    cast(Sensor.location, Geography),
                    settings.incident_detection_radius_meters,
                ),
            )
        )
        reports = reports_result.scalars().all()

        threshold = settings.incident_complaints_threshold
        if len(reports) < threshold:
            return

        # Правило сработало: создаём инцидент и привязываем датчик и жалобы
        incident = Incident(
            district_id=sensor.district_id,
            title=f"Аномалия {metric_name} ({value}) у датчика {sensor.name}",
            status="CRITICAL",
            confidence_rate=compute_confidence(len(reports), threshold),
            operator_comment=(
                f"Автодетектор: {len(reports)} жалоб в радиусе "
                f"{settings.incident_detection_radius_meters} м за "
                f"{settings.incident_detection_window_hours} ч."
            ),
        )
        incident.sensors.append(sensor)
        for report in reports:
            report.status = "IN_PROGRESS"
            incident.reports.append(report)

        db.add(incident)
        await db.commit()