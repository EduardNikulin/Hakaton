# backend/app/routers/sensors.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from geoalchemy2.functions import ST_Contains, ST_SetSRID, ST_MakePoint

from app.database import get_db
from app.dependencies import get_current_user, RoleChecker
from app.models.core import District
from app.models.sensors import Sensor, SensorMeasurement
from app.schemas.sensors import SensorSchema, SensorCreate, MeasurementCreate, MeasurementHistoryOut
from app.tasks.incident_detector import run_incident_detection

router = APIRouter(prefix="/api/v1/sensors", tags=["IoT Sensors Gateway"])

# Ограничения доступа
allow_sensors_operators = Depends(RoleChecker(allowed_roles=["author", "admin"]))
# Создание/демонтаж постов - только Админ
allow_sensors_admin = Depends(RoleChecker(allowed_roles=["admin"]))

@router.get("", response_model=list[SensorSchema])
async def get_all_sensors(db: AsyncSession = Depends(get_db)):
    """Получение всех датчиков города с координатами [lat, lon] для отображения на карте.
    Координаты вычисляются из геометрии модели Sensor (column_property)."""
    result = await db.execute(select(Sensor).where(Sensor.status == "ACTIVE"))
    return result.scalars().all()

@router.get("/{id}/history", response_model=list[MeasurementHistoryOut])
async def get_sensor_history(id: int, db: AsyncSession = Depends(get_db)):
    """Получение исторических логов замеров конкретного датчика за последние сутки для графиков."""
    result = await db.execute(
        select(SensorMeasurement)
        .where(SensorMeasurement.sensor_id == id)
        .order_by(SensorMeasurement.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()

@router.post("", response_model=SensorSchema, status_code=status.HTTP_201_CREATED, dependencies=[allow_sensors_admin])
async def create_sensor(data: SensorCreate, db: AsyncSession = Depends(get_db)):
    """Создание нового поста мониторинга (доступ: Админ).
    Если район не задан явно - определяется автоматически через PostGIS ST_Contains."""
    lat, lon = data.location[0], data.location[1]
    geo_point = ST_SetSRID(ST_MakePoint(lon, lat), 4326)

    district_id = data.district_id
    if district_id is None:
        district_query = await db.execute(
            select(District).where(ST_Contains(District.polygon, geo_point))
        )
        district = district_query.scalars().first()
        district_id = district.id if district else None

    new_sensor = Sensor(
        name=data.name,
        sensor_type=data.sensor_type,
        district_id=district_id,
        # EWKT-строка: явный SRID, иначе PostGIS сохранит точку без системы координат
        location=f"SRID=4326;POINT({lon} {lat})",
        status=data.status,
    )
    db.add(new_sensor)
    await db.commit()

    # Повторный SELECT: lat/lon - это column_property, вычисляются при выборке
    result = await db.execute(select(Sensor).where(Sensor.id == new_sensor.id))
    return result.scalars().one()

@router.post("/iot/measurements", status_code=status.HTTP_201_CREATED)
async def receive_iot_measurement(data: MeasurementCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """Точка входа для скрипта-симулятора. Запускает BackgroundTasks автодетектора инцидентов."""
    # Проверяем, что датчик существует: иначе вставка упадёт на FK с неинформативным 500
    sensor_result = await db.execute(select(Sensor).where(Sensor.id == data.sensor_id))
    if sensor_result.scalars().first() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Датчик с id={data.sensor_id} не найден в системе",
        )

    new_measurement = SensorMeasurement(
        sensor_id=data.sensor_id,
        value=data.value,
        metric_name=data.metric_name,
        quality_status=data.quality_status
    )
    db.add(new_measurement)
    await db.commit()

    # Фоновая проверка детектора: аномалия + жалобы в радиусе -> инцидент.
    # Задача стартует после отправки ответа, чтобы ГИС-расчеты не тормозили приём замера.
    background_tasks.add_task(
        run_incident_detection, data.sensor_id, data.metric_name, data.value
    )

    return {"status": "accepted", "measurement_id": new_measurement.id}

@router.patch("/{id}", status_code=status.HTTP_200_OK)
async def update_sensor(id: int, name: str, status: str, db: AsyncSession = Depends(get_db), _=allow_sensors_operators):
    """Редактирование метаданных датчика — изменение названия или статуса поста (Update)."""
    result = await db.execute(select(Sensor).where(Sensor.id == id))
    sensor = result.scalars().first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Датчик не найден в системе")

    sensor.name = name
    sensor.status = status
    await db.commit()
    return {"message": "Параметры датчика успешно изменены экологом"}

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_sensor(id: int, db: AsyncSession = Depends(get_db), _=allow_sensors_operators):
    """Принудительное демонтирование (удаление) датчика с карты города оператором (Delete)."""
    result = await db.execute(select(Sensor).where(Sensor.id == id))
    sensor = result.scalars().first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Датчик не найден")

    await db.delete(sensor)
    await db.commit()
    return {"message": "Пост мониторинга успешно удален из базы данных"}
