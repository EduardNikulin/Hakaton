# backend/app/repositories/sensor_repository.py
"""Доступ к данным датчиков (sensors) и замеров (measurements). Только SQL."""
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sensors import Sensor, SensorMeasurement


class SensorRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        *,
        name: str,
        sensor_type: str,
        district_id: Optional[int],
        location_ewkt: str,
        status: str = "ACTIVE",
    ) -> Sensor:
        sensor = Sensor(
            name=name,
            sensor_type=sensor_type,
            district_id=district_id,
            location=location_ewkt,
            status=status,
        )
        self.db.add(sensor)
        await self.db.flush()
        return sensor

    async def get(self, sensor_id: int) -> Sensor | None:
        result = await self.db.execute(
            select(Sensor).where(Sensor.id == sensor_id)
        )
        return result.scalars().first()

    async def list_active(self) -> list[Sensor]:
        result = await self.db.execute(
            select(Sensor).where(Sensor.status == "ACTIVE")
        )
        return list(result.scalars().all())

    async def update(self, sensor: Sensor, *, name: str | None = None, status: str | None = None) -> None:
        if name is not None:
            sensor.name = name
        if status is not None:
            sensor.status = status

    async def delete(self, sensor: Sensor) -> None:
        await self.db.delete(sensor)

    # ── Замеры ──────────────────────────────────────────────────────

    async def add_measurement(
        self,
        *,
        sensor_id: int,
        value: float,
        metric_name: str,
        quality_status: str = "VALID",
    ) -> SensorMeasurement:
        measurement = SensorMeasurement(
            sensor_id=sensor_id,
            value=value,
            metric_name=metric_name,
            quality_status=quality_status,
        )
        self.db.add(measurement)
        await self.db.flush()
        return measurement

    async def get_history(
        self,
        sensor_id: int,
        limit: int = 50,
    ) -> list[SensorMeasurement]:
        result = await self.db.execute(
            select(SensorMeasurement)
            .where(SensorMeasurement.sensor_id == sensor_id)
            .order_by(SensorMeasurement.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())