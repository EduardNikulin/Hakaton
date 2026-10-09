# backend/app/repositories/district_repository.py
"""Доступ к данным районов (districts). Только SQL, без правил."""
import json
from geoalchemy2.functions import ST_Contains
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.core import City, District
from app.models.feedback import Report
from app.models.sensors import EcoIndexHistory
from app.services.geo import make_point

# Источники метрик вынесены в общий модуль eci_metrics (единый расчёт с картой)
from app.services.eci_metrics import PM25_METRICS, PH_METRICS  # noqa: F401  (реэкспорт)


class DistrictRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Гео-поиск ───────────────────────────────────────────────────

    async def find_by_point(self, lat: float, lon: float) -> District | None:
        """Район, чей полигон содержит точку (ST_Contains). None, если вне всех районов."""
        result = await self.db.execute(
            select(District).where(ST_Contains(District.polygon, make_point(lat, lon)))
        )
        return result.scalars().first()

    # ── CRUD ────────────────────────────────────────────────────────

    async def list_all(self) -> list[District]:
        return list(await self.db.scalars(select(District).order_by(District.id)).all())

    async def list_all_short(self) -> list[District]:
        return list(await self.db.scalars(select(District).order_by(District.name.asc())).all())

    async def get(self, district_id: int) -> District | None:
        result = await self.db.execute(select(District).where(District.id == district_id))
        return result.scalars().first()

    async def create(self, *, name: str, polygon_ewkt: str, city_id: int,
                     eci_score: float, color_hex: str) -> District:
        district = District(
            city_id=city_id, name=name, polygon=polygon_ewkt,
            eci_score=eci_score, color_hex=color_hex,
        )
        self.db.add(district)
        await self.db.commit()
        await self.db.refresh(district)
        return district

    async def update(self, district: District, *, name: str | None = None,
                     polygon_ewkt: str | None = None, color_hex: str | None = None) -> None:
        if name is not None:
            district.name = name
        if polygon_ewkt is not None:
            district.polygon = polygon_ewkt
        if color_hex is not None:
            district.color_hex = color_hex
        await self.db.commit()

    async def delete(self, district: District) -> None:
        await self.db.delete(district)
        await self.db.commit()

    async def get_first_city(self) -> City | None:
        result = await self.db.execute(select(City).order_by(City.id).limit(1))
        return result.scalars().first()

    async def get_history(self, district_id: int, limit: int = 100) -> list[dict]:
        """История ECI района для графика динамики (последние `limit` точек по возрастанию)."""
        result = await self.db.execute(
            select(EcoIndexHistory.calculated_at, EcoIndexHistory.eci_score)
            .where(EcoIndexHistory.district_id == district_id)
            .order_by(EcoIndexHistory.calculated_at.desc())
            .limit(limit)
        )
        rows = result.all()
        return [
            {"calculated_at": row.calculated_at.isoformat(), "eci_score": row.eci_score}
            for row in reversed(rows)
        ]

    # ── GeoJSON-обёртка ─────────────────────────────────────────────

    @staticmethod
    def _to_geojson_dict(geojson_str) -> dict:
        """Строка GeoJSON от ST_AsGeoJSON → Python dict."""
        return json.loads(geojson_str) if geojson_str else {}

    async def list_with_geojson(self) -> list[dict]:
        """Районы с границами в формате GeoJSON (для Яндекс Карт)."""
        result = await self.db.execute(
            select(
                District.id,
                District.city_id,
                District.name,
                func.ST_AsGeoJSON(District.polygon).label("geojson"),
                District.eci_score,
                District.color_hex,
            )
        )
        rows = result.all()
        return [
            {
                "id": row.id,
                "city_id": row.city_id,
                "name": row.name,
                "polygon_geojson": self._to_geojson_dict(row.geojson),
                "eci_score": row.eci_score,
                "color_hex": row.color_hex,
            }
            for row in rows
        ]

    async def get_with_geojson(self, district_id: int) -> dict | None:
        """Один район с границами в формате GeoJSON (для POST/PATCH ответа)."""
        result = await self.db.execute(
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
        if not row:
            return None
        return {
            "id": row.id,
            "city_id": row.city_id,
            "name": row.name,
            "polygon_geojson": self._to_geojson_dict(row.geojson),
            "eci_score": row.eci_score,
            "color_hex": row.color_hex,
        }

    # ── ECI-статистика района ───────────────────────────────────────

    async def get_eci_stats(self, district_id: int) -> dict | None:
        """Расклад ECI на компоненты — тем же расчётом, что и на карте.

        Использует то же окно (settings.eci_window_hours) и реальный тренд,
        поэтому компоненты в панели совпадают с итоговым eci_score района.
        """
        from app.config import settings
        from app.services.eci import air_score, water_score, citizen_score, trend_score
        from app.services.eci_metrics import district_eci_inputs

        district = await self.get(district_id)
        if not district:
            return None

        m = await district_eci_inputs(self.db, district_id, settings.eci_window_hours)

        return {
            "air_score": round(air_score(m["avg_pm25"] if m["avg_pm25"] is not None else 10.0), 1),
            "water_score": round(water_score(m["avg_ph"] if m["avg_ph"] is not None else 7.5), 1),
            "citizen_score": round(citizen_score(m["complaints"]), 1),
            "trend_score": round(trend_score(m["trend"]), 1),
        }

    # ── Geo-хелперы ─────────────────────────────────────────────────

    @staticmethod
    def geojson_to_ewkt(coordinates) -> str:
        """GeoJSON-полигон → EWKT-строка с SRID 4326."""
        rings = []
        for ring in coordinates:
            points = ", ".join(f"{lon} {lat}" for lon, lat in ring)
            rings.append(f"({points})")
        return "SRID=4326;POLYGON(" + ", ".join(rings) + ")"