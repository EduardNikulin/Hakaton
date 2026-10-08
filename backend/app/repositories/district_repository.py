# backend/app/repositories/district_repository.py
"""Доступ к данным районов (districts). Только SQL, без правил."""
from geoalchemy2.functions import ST_Contains
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.core import District
from app.services.geo import make_point


class DistrictRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_by_point(self, lat: float, lon: float) -> District | None:
        """Район, чей полигон содержит точку (ST_Contains). None, если вне всех районов."""
        result = await self.db.execute(
            select(District).where(ST_Contains(District.polygon, make_point(lat, lon)))
        )
        return result.scalars().first()