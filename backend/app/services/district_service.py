# backend/app/services/district_service.py
"""Бизнес-логика районов: CRUD, GeoJSON-конвертация, ECI-статистика. Транзакции - здесь."""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.core import District
from app.repositories.district_repository import DistrictRepository


class DistrictService:
    """Сценарии работы с районами. Границы транзакций - здесь (commit)."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.districts = DistrictRepository(db)

    # ── Чтение ──────────────────────────────────────────────────────

    async def list_all(self) -> list[dict]:
        return await self.districts.list_with_geojson()

    async def list_short(self) -> list[District]:
        return await self.districts.list_all_short()

    async def get_eci_stats(self, district_id: int) -> dict:
        stats = await self.districts.get_eci_stats(district_id)
        if stats is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Район города не найден",
            )
        return stats

    # ── CRUD ────────────────────────────────────────────────────────

    async def create(
        self, *, name: str, polygon, city_id: int | None, color_hex: str | None,
    ) -> dict:
        """Создание района. Если city_id не задан — берётся первый город из БД."""
        city = await self.districts.get_first_city()
        if city is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="В базе нет ни одного города - сначала создайте город",
            )
        target_city = city_id or city.id

        district = await self.districts.create(
            name=name,
            polygon_ewkt=DistrictRepository.geojson_to_ewkt(polygon),
            city_id=target_city,
            eci_score=50.0,
            color_hex=color_hex or "#f59e0b",
        )
        return await self.districts.get_with_geojson(district.id)

    async def update(
        self, district_id: int, *, name: str | None = None,
        polygon=None, color_hex: str | None = None,
    ) -> dict:
        """Частичное обновление района (имя, границы, цвет)."""
        district = await self.districts.get(district_id)
        if not district:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Район не найден",
            )

        ewkt = None
        if polygon is not None:
            ewkt = DistrictRepository.geojson_to_ewkt(polygon)

        await self.districts.update(district, name=name, polygon_ewkt=ewkt, color_hex=color_hex)
        return await self.districts.get_with_geojson(district_id)

    async def delete(self, district_id: int) -> None:
        district = await self.districts.get(district_id)
        if not district:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Район не найден",
            )
        name = district.name
        await self.districts.delete(district)
        return None  # noqa: R504 — return value is ignored, just for clarity
    
    async def get_history(self, district_id: int) -> list[dict]:
        return await self.districts.get_history(district_id)