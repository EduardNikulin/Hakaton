# backend/app/routers/maps.py
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.database import get_db
from app.models.core import District
from app.models.feedback import Report
from app.models.sensors import SensorMeasurement, EcoIndexHistory
from app.schemas.core import DistrictSchema, EciStatsSchema, DistrictShortOut
from app.dependencies import RoleChecker

router = APIRouter(prefix="/api/v1/maps", tags=["Yandex Maps Layers"])

# Административные ограничения доступа
allow_admin = Depends(RoleChecker(allowed_roles=["admin"]))

@router.get("/districts", response_model=list[DistrictSchema])
async def get_map_districts(db: AsyncSession = Depends(get_db)):
    """
    Главная ручка для Яндекс Карт. 
    Возвращает границы районов в формате GeoJSON, текущий ECI индекс и цвет hex для покраски полигонов.
    """
    # Вытаскиваем районы, на лету конвертируя бинарную геометрию PostGIS в текстовый GeoJSON
    query = select(
        District.id,
        District.city_id,
        District.name,
        func.ST_AsGeoJSON(District.polygon).label("geojson"),
        District.eci_score,
        District.color_hex
    )
    result = await db.execute(query)
    rows = result.all()

    districts = []
    for row in rows:
        # Парсим текстовую строку GeoJSON, полученную от базы данных, обратно в словарь Python
        geojson_dict = json.loads(row.geojson) if row.geojson else {}
        
        districts.append({
            "id": row.id,
            "city_id": row.city_id,
            "name": row.name,
            "polygon_geojson": geojson_dict,
            "eci_score": row.eci_score,
            "color_hex": row.color_hex
        })
    return districts

@router.get("/districts/list", response_model=list[DistrictShortOut])
async def get_districts_short_list(db: AsyncSession = Depends(get_db)):
    """Упрощенный плоский список районов города (для выпадающих списков при регистрации или создании жалобы)."""
    result = await db.execute(select(District).order_by(District.name.asc()))
    return result.scalars().all()

@router.get("/districts/{id}/stats", response_model=EciStatsSchema)
async def get_district_eci_explainability(id: int, db: AsyncSession = Depends(get_db)):
    """
    Объяснимость ECI индекса. 
    Модальное окно при клике на район, раскрывающее вклады всех 4 компонентов в экологию.
    """
    # Проверяем физическое существование района
    district_result = await db.execute(select(District).where(District.id == id))
    if not district_result.scalars().first():
        raise HTTPException(status_code=404, detail="Район города не найден")

    # Для демонстрации MVP на хакатоне мы вычисляем реальные средние значения из базы,
    # формируя честные вклады компонентов в итоговую оценку района.
    air_query = await db.execute(
        select(func.avg(SensorMeasurement.value))
        .join(SensorMeasurement.sensor)
        .where(SensorMeasurement.sensor.has(district_id=id), SensorMeasurement.metric_name == "PM2.5")
    )
    avg_air = air_query.scalar() or 20.0  # Дефолтная норма, если датчиков еще нет

    water_query = await db.execute(
        select(func.avg(SensorMeasurement.value))
        .join(SensorMeasurement.sensor)
        .where(SensorMeasurement.sensor.has(district_id=id), SensorMeasurement.metric_name == "pH")
    )
    avg_water = water_query.scalar() or 7.0

    reports_query = await db.execute(
        select(func.count(Report.id)).where(Report.district_id == id, Report.status != "RESOLVED")
    )
    citizen_complaints = reports_query.scalar() or 0

    # Маппим значения к диапазону 0..100 для красивого вывода графиков
    return {
        "air_score": min(float(avg_air) * 1.5, 100.0),
        "water_score": min(float(avg_water) * 10.0, 100.0),
        "citizen_score": min(float(citizen_complaints) * 12.0, 100.0),
        "trend_score": 35.5  # Статичный тренд стабильности среды для MVP
    }

@router.delete("/districts/{id}", status_code=status.HTTP_200_OK, dependencies=[allow_admin])
async def admin_delete_district(id: int, db: AsyncSession = Depends(get_db)):
    """Административное удаление района города из ГИС-системы (Delete)."""
    result = await db.execute(select(District).where(District.id == id))
    district = result.scalars().first()
    if not district:
        raise HTTPException(status_code=404, detail="Район не найден")
        
    await db.delete(district)
    await db.commit()
    return {"status": "success", "message": f"Район '{district.name}' успешно удален из картографии"}
