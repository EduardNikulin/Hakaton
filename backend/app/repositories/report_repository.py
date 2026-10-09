# backend/app/repositories/report_repository.py
"""Доступ к данным жалоб (reports). Только SQL, без бизнес-логики."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.feedback import Report
from typing import List



class ReportRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self, *, user_id: int, district_id: int | None,
        category: str, description: str, location_ewkt: str,
    ) -> Report:
        report = Report(
            user_id=user_id,
            district_id=district_id,
            category=category,
            description=description,
            location=location_ewkt,
            status="NEW",
        )
        self.db.add(report)
        await self.db.flush()  # получаем id, не завершая транзакцию
        return report

    async def get(self, report_id: int) -> Report | None:
        # selectinload обязателен: в async ленивая загрузка запрещена (MissingGreenlet)
        result = await self.db.execute(
            select(Report)
            .where(Report.id == report_id)
            .options(selectinload(Report.attachments))
        )
        return result.scalars().first()

    async def list(self, district_id: int | None = None) -> List[Report]:
        query = select(Report).options(selectinload(Report.attachments))
        if district_id is not None:
            query = query.where(Report.district_id == district_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def list_by_user(self, user_id: int) -> List[Report]:
        result = await self.db.execute(
            select(Report)
            .where(Report.user_id == user_id)
            .options(selectinload(Report.attachments))
        )
        return list(result.scalars().all())

    async def delete(self, report: Report) -> None:
        await self.db.delete(report)