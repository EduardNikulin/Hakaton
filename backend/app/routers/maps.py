# backend/app/routers/maps.py
"""HTTP-слой карт и районов. Только приём запроса и вызов сервиса - никакого SQL.
URL-ы сохранены: /api/v1/maps/districts"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import RoleChecker
from app.schemas.core import DistrictSchema, DistrictCreate, DistrictUpdate, EciStatsSchema, DistrictShortOut
from app.services.district_service import DistrictService

router = APIRouter(prefix="/api/v1/maps", tags=["Yandex Maps Layers"])

allow_admin = Depends(RoleChecker(allowed_roles=["admin"]))


@router.get("/districts", response_model=list[DistrictSchema])
async def get_map_districts(db: AsyncSession = Depends(get_db)):
    """Границы районов в формате GeoJSON, текущий ECI индекс и цвет для покраски полигонов."""
    return await DistrictService(db).list_all()


@router.get("/districts/list", response_model=list[DistrictShortOut])
async def get_districts_short_list(db: AsyncSession = Depends(get_db)):
    """Плоский список районов для выпадающих списков."""
    return await DistrictService(db).districts.list_all_short()


@router.get("/districts/{id}/stats", response_model=EciStatsSchema)
async def get_district_eci_explainability(id: int, db: AsyncSession = Depends(get_db)):
    """Расклад ECI на компоненты: воздух, вода, жалобы, тренд."""
    return await DistrictService(db).get_eci_stats(id)


@router.get("/districts/{id}/history")
async def get_district_eci_history(id: int, db: AsyncSession = Depends(get_db)):
    """История значений ECI района (для графика динамики)."""
    return await DistrictService(db).get_history(id)


@router.post("/districts", response_model=DistrictSchema, status_code=201, dependencies=[allow_admin])
async def create_district(data: DistrictCreate, db: AsyncSession = Depends(get_db)):
    """Создание района с границами (доступ: Админ)."""
    return await DistrictService(db).create(
        name=data.name,
        polygon=data.polygon,
        city_id=data.city_id,
        color_hex=data.color_hex,
    )


@router.patch("/districts/{id}", response_model=DistrictSchema, dependencies=[allow_admin])
async def update_district(id: int, data: DistrictUpdate, db: AsyncSession = Depends(get_db)):
    """Редактирование имени/границ/цвета района (доступ: Админ)."""
    return await DistrictService(db).update(
        id, name=data.name, polygon=data.polygon, color_hex=data.color_hex,
    )


@router.delete("/districts/{id}", status_code=200, dependencies=[allow_admin])
async def admin_delete_district(id: int, db: AsyncSession = Depends(get_db)):
    """Удаление района из ГИС (доступ: Админ)."""
    await DistrictService(db).delete(id)
    return {"status": "success", "message": "Район успешно удален из картографии"}