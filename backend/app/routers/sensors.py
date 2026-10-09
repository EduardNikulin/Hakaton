# backend/app/routers/sensors.py
"""HTTP-слой датчиков. Только приём запроса и вызов сервиса - никакого SQL.
URL-ы сохранены: /api/v1/sensors"""
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import RoleChecker
from app.schemas.sensors import SensorSchema, SensorCreate, MeasurementCreate, MeasurementHistoryOut
from app.services.sensor_service import SensorService

router = APIRouter(prefix="/api/v1/sensors", tags=["IoT Sensors Gateway"])

allow_sensors_operators = Depends(RoleChecker(allowed_roles=["author", "admin"]))
allow_sensors_admin = Depends(RoleChecker(allowed_roles=["admin"]))


@router.get("", response_model=list[SensorSchema])
async def get_all_sensors(db: AsyncSession = Depends(get_db)):
    """Все активные датчики города с координатами [lat, lon] для карты."""
    return await SensorService(db).list_active()


@router.get("/{id}/history", response_model=list[MeasurementHistoryOut])
async def get_sensor_history(id: int, db: AsyncSession = Depends(get_db)):
    """История замеров конкретного датчика (последние 50 записей)."""
    return await SensorService(db).sensors.get_history(id)


@router.post("", response_model=SensorSchema, status_code=201, dependencies=[allow_sensors_admin])
async def create_sensor(
    data: SensorCreate,
    db: AsyncSession = Depends(get_db),
):
    """Создание датчика (доступ: Админ). Авто-район через PostGIS."""
    return await SensorService(db).create_sensor(
        name=data.name,
        sensor_type=data.sensor_type,
        lat=data.location[0],
        lon=data.location[1],
        district_id=data.district_id,
        status=data.status,
    )


@router.post("/iot/measurements", status_code=201)
async def receive_iot_measurement(
    data: MeasurementCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """IoT-шлюз: приём замера + запуск фонового детектора инцидентов."""
    measurement_id = await SensorService(db).ingest_measurement(
        sensor_id=data.sensor_id,
        value=data.value,
        metric_name=data.metric_name,
        quality_status=data.quality_status,
    )

    # Фоновая проверка: аномалия + жалобы в радиусе -> инцидент
    from app.tasks.incident_detector import run_incident_detection

    background_tasks.add_task(
        run_incident_detection,
        data.sensor_id,
        data.metric_name,
        data.value,
    )

    return {"status": "accepted", "measurement_id": measurement_id}


@router.patch("/{id}", status_code=200)
async def update_sensor(
    id: int,
    name: str,
    status: str,
    db: AsyncSession = Depends(get_db),
    _=allow_sensors_operators,
):
    """Редактирование метаданных датчика (доступ: Author, Admin)."""
    return await SensorService(db).update_sensor(id, name=name, status=status)


@router.delete("/{id}", status_code=200)
async def delete_sensor(
    id: int,
    db: AsyncSession = Depends(get_db),
    _=allow_sensors_operators,
):
    """Демонтаж датчика (доступ: Author, Admin)."""
    await SensorService(db).delete_sensor(id)
    return {"status": "success", "message": "Пост мониторинга успешно удален из базы данных"}