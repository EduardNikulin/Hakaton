# backend/app/routers/maps.py
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.database import get_db
from app.models.core import City, District
from app.models.feedback import Report
from app.models.sensors import Sensor, SensorMeasurement, EcoIndexHistory
from app.schemas.core import DistrictSchema, DistrictCreate, DistrictUpdate, EciStatsSchema, DistrictShortOut
from app.dependencies import RoleChecker
from app.services.eci import air_score, water_score, citizen_score, trend_score

# Единый источник имён метрик (нижний регистр, как в seed/eci_calculator/detector)
PM25_METRICS = ("pm25", "pm2.5")
PH_METRICS = ("ph",)

router = APIRouter(prefix="/api/v1/maps", tags=["Yandex Maps Layers"])

# Административные ограничения доступа
allow_admin = Depends(RoleChecker(allowed_roles=["admin"]))



def geojson_polygon_to_ewkt(coordinates: list) -> str:
    """Преобразует GeoJSON-координаты полигона (кольца [lon, lat]) в EWKT-строку
    с явным SRID 4326 - в таком виде PostGIS корректно сохраняет геометрию."""
    rings = []
    for ring in coordinates:
        points = ", ".join(f"{lon} {lat}" for lon, lat in ring)
        rings.append(f"({points})")
    return "SRID=4326;POLYGON(" + ", ".join(rings) + ")"


async def fetch_district_response(db: AsyncSession, district_id: int) -> dict:
    """Собирает район в формате DistrictSchema (границы - через ST_AsGeoJSON)."""
    result = await db.execute(
        select(
            District.id,
            District.city_id,
            District.name,
            func.ST_AsGeoJSON(District.polygon).label("geojson"),
            District.eci_score,
            District.color_hex,
        ).where(District.id == district_id)
    )
    row = result.first()
    return {
        "id": row.id,
        "city_id": row.city_id,
        "name": row.name,
        "polygon_geojson": json.loads(row.geojson) if row.geojson else {},
        "eci_score": row.eci_score,
        "color_hex": row.color_hex,
    }


@router.post("/districts", response_model=DistrictSchema, status_code=status.HTTP_201_CREATED, dependencies=[allow_admin])
async def create_district(data: DistrictCreate, db: AsyncSession = Depends(get_db)):
    """Создание района с границами (доступ: Админ)."""
    city_id = data.city_id
    if city_id is None:
        city_result = await db.execute(select(City).order_by(City.id).limit(1))
        city = city_result.scalars().first()
        if city is None:
            raise HTTPException(
                status_code=400,
                detail="В базе нет ни одного города - сначала создайте город",
            )
        city_id = city.id

    new_district = District(
        city_id=city_id,
        name=data.name,
        polygon=geojson_polygon_to_ewkt(data.polygon),
        eci_score=50.0,
        color_hex=data.color_hex or "#f59e0b",
    )
    db.add(new_district)
    await db.commit()
    return await fetch_district_response(db, new_district.id)


@router.patch("/districts/{id}", response_model=DistrictSchema, dependencies=[allow_admin])
async def update_district(id: int, data: DistrictUpdate, db: AsyncSession = Depends(get_db)):
    """Редактирование имени/границ/цвета района (доступ: Админ)."""
    result = await db.execute(select(District).where(District.id == id))
    district = result.scalars().first()
    if not district:
        raise HTTPException(status_code=404, detail="Район не найден")

    if data.name is not None:
        district.name = data.name
    if data.polygon is not None:
        district.polygon = geojson_polygon_to_ewkt(data.polygon)
    if data.color_hex is not None:
        district.color_hex = data.color_hex

    await db.commit()
    return await fetch_district_response(db, id)

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
        .join(Sensor, Sensor.id == SensorMeasurement.sensor_id)
        .where(Sensor.district_id == id,
               func.lower(SensorMeasurement.metric_name).in_(PM25_METRICS))
    )
    avg_air = air_query.scalar()

    water_query = await db.execute(
        select(func.avg(SensorMeasurement.value))
        .join(Sensor, Sensor.id == SensorMeasurement.sensor_id)
        .where(Sensor.district_id == id,
               func.lower(SensorMeasurement.metric_name).in_(PH_METRICS))
    )
    avg_water = water_query.scalar()

    reports_query = await db.execute(
        select(func.count(Report.id)).where(Report.district_id == id, Report.status != "RESOLVED")
    )
    citizen_complaints = reports_query.scalar() or 0

    # Единая семантика с services/eci.py: ВЫШЕ = ЧИЩЕ
    return {
        "air_score": round(air_score(avg_air if avg_air is not None else 10.0), 1),
        "water_score": round(water_score(avg_water if avg_water is not None else 7.5), 1),
        "citizen_score": round(citizen_score(citizen_complaints), 1),
        "trend_score": round(trend_score(0.0), 1),
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
