# backend/app/services/sensor_service.py
"""Бизнес-логика датчиков: CRUD, IoT-приём замеров. Транзакции - здесь."""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sensors import Sensor
from app.repositories.district_repository import DistrictRepository
from app.repositories.sensor_repository import SensorRepository
from app.services.geo import point_ewkt


class SensorService:
    """Сценарии работы с датчиками. Границы транзакций - здесь (commit)."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.sensors = SensorRepository(db)
        self.districts = DistrictRepository(db)

    async def create_sensor(
        self,
        *,
        name: str,
        sensor_type: str,
        lat: float,
        lon: float,
        district_id: int | None = None,
        status: str = "ACTIVE",
    ) -> Sensor:
        """Создание датчика с автоопределением района (ST_Contains)."""
        district = await self.districts.find_by_point(lat, lon)
        district_id = district_id or (district.id if district else None)

        sensor = await self.sensors.create(
            name=name,
            sensor_type=sensor_type,
            district_id=district_id,
            location_ewkt=point_ewkt(lat, lon),
            status=status,
        )
        await self.db.commit()
        return await self.sensors.get(sensor.id)

    async def get_sensor(self, sensor_id: int) -> Sensor | None:
        return await self.sensors.get(sensor_id)

    async def list_active(self) -> list[Sensor]:
        return await self.sensors.list_active()

    async def update_sensor(
        self,
        sensor_id: int,
        *,
        name: str | None = None,
        status: str | None = None,
    ) -> Sensor:
        sensor = await self.sensors.get(sensor_id)
        if not sensor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Датчик не найден в системе",
            )
        await self.sensors.update(sensor, name=name, status=status)
        await self.db.commit()
        # Перечитываем, чтобы column_property lat/lon были загружены (иначе MissingGreenlet)
        return await self.sensors.get(sensor_id)

    async def delete_sensor(self, sensor_id: int) -> None:
        sensor = await self.sensors.get(sensor_id)
        if not sensor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Датчик не найден",
            )
        await self.sensors.delete(sensor)
        await self.db.commit()

    # ── IoT-приём замеров ───────────────────────────────────────────

    async def ingest_measurement(
        self,
        *,
        sensor_id: int,
        value: float,
        metric_name: str,
        quality_status: str = "VALID",
    ) -> int:
        """Приём замера. Проверяет существование датчика, вставляет замер.
        Возвращает ID измерения. Вызывается из роутера с BackgroundTasks.
        """
        sensor = await self.sensors.get(sensor_id)
        if not sensor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Датчик с id={sensor_id} не найден в системе",
            )

        measurement = await self.sensors.add_measurement(
            sensor_id=sensor_id,
            value=value,
            metric_name=metric_name,
            quality_status=quality_status,
        )
        await self.db.commit()
        return measurement.id
