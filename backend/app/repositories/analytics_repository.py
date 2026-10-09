# backend/app/repositories/analytics_repository.py
"""Доступ к данным для аналитических дашбордов. Только SQL."""
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.core import District
from app.models.feedback import Report
from app.models.incidents import Incident


class AnalyticsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Глобальный дашборд ──────────────────────────────────────────

    async def count_active_incidents(self) -> int:
        result = await self.db.execute(
            select(func.count(Incident.id)).where(Incident.status != "RESOLVED")
        )
        return result.scalar() or 0

    async def count_total_reports(self) -> int:
        result = await self.db.execute(select(func.count(Report.id)))
        return result.scalar() or 0

    async def get_best_district(self) -> tuple[str, float]:
        """Самый чистый район = максимальный ECI."""
        result = await self.db.execute(
            select(District.name, District.eci_score)
            .order_by(District.eci_score.desc())
            .limit(1)
        )
        row = result.first()
        return (row[0], row[1]) if row else ("Нет данных", 0.0)

    async def get_worst_district(self) -> tuple[str, float]:
        """Самая проблемная зона = минимальный ECI."""
        result = await self.db.execute(
            select(District.name, District.eci_score)
            .order_by(District.eci_score.asc())
            .limit(1)
        )
        row = result.first()
        return (row[0], row[1]) if row else ("Нет данных", 0.0)

    # ── Корреляции ──────────────────────────────────────────────────

    async def get_correlations(self) -> list[dict]:
        """Жалобы по районам и категориям."""
        query = (
            select(District.name, Report.category, func.count(Report.id))
            .join(Report, District.id == Report.district_id)
            .group_by(District.name, Report.category)
            .order_by(func.count(Report.id).desc())
        )
        result = await self.db.execute(query)
        rows = result.all()
        return [
            {
                "district": row[0],
                "feedback_category": row[1],
                "total_complaints": row[2],
            }
            for row in rows
        ]