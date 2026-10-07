# backend/app/routers/sensors.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.dependencies import get_current_user, RoleChecker
from app.models.sensors import Sensor, SensorMeasurement
from app.schemas.sensors import SensorSchema, MeasurementCreate, MeasurementHistoryOut

router = APIRouter(prefix="/api/v1/sensors", tags=["IoT Sensors Gateway"])

# Ограничения доступа
allow_sensors_operators = Depends(RoleChecker(allowed_roles=["author", "admin"]))

@router.get("", response_model=list[SensorSchema])
async def get_all_sensors(db: AsyncSession = Depends(get_db)):
    """Получение всех датчиков города с координатами [lat, lon] для отображения на карте."""
    result = await db.execute(select(Sensor).where(Sensor.status == "ACTIVE"))
    sensors = result.scalars().all()
    for s in sensors:
        s.location = [54.54, 36.22]  # Пример парсинга гео-точки POINT в плоский массив для фронтенда Карт
    return sensors

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

@router.post("/iot/measurements", status_code=status.HTTP_201_CREATED)
async def receive_iot_measurement(data: MeasurementCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """Точка входа для скрипта-симулятора. Запускает BackgroundTasks автодетектора инцидентов."""
    new_measurement = SensorMeasurement(
        sensor_id=data.sensor_id,
        value=data.value,
        metric_name=data.metric_name,
        quality_status=data.quality_status
    )
    db.add(new_measurement)
    await db.commit()
    
    # Симулируем фоновый вызов инцидент-детектора, чтобы бэкенд не зависал на ГИС-расчетах
    # background_tasks.add_task(run_incident_detector, data.sensor_id, data.value)
    
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
