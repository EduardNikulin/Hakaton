# backend/app/services/report_service.py
"""Бизнес-логика жалоб: автоопределение района, проверка прав, транзакции."""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feedback import Report
from app.models.users import User
from app.repositories.district_repository import DistrictRepository
from app.repositories.report_repository import ReportRepository
from app.services.geo import point_ewkt


class ReportService:
    """Сценарии работы с жалобами. Границы транзакций - здесь (commit)."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.reports = ReportRepository(db)
        self.districts = DistrictRepository(db)

    async def create_report(
        self, *, user: User, category: str, description: str, lat: float, lon: float,
    ) -> Report:
        """Создать жалобу с автоопределением района по координатам."""
        district = await self.districts.find_by_point(lat, lon)
        report = await self.reports.create(
            user_id=user.id,
            district_id=district.id if district else None,
            category=category,
            description=description,
            location_ewkt=point_ewkt(lat, lon),
        )
        await self.db.commit()
        # Перечитываем: подгружаем attachments и вычисляемые lat/lon
        return await self.reports.get(report.id)

    async def list_reports(self, district_id: int | None = None) -> list[Report]:
        return await self.reports.list(district_id)

    async def list_my_reports(self, user: User) -> list[Report]:
        return await self.reports.list_by_user(user.id)

    async def update_description(
        self, *, report_id: int, user: User, description: str,
    ) -> Report:
        report = await self.reports.get(report_id)
        if not report or report.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Обращение не найдено или у вас нет прав на его редактирование",
            )
        report.description = description
        await self.db.commit()
        # Перечитываем: column_property lat/lon должны быть загружены заново,
        # иначе Pydantic при сериализации дёргает ленивую загрузку → MissingGreenlet (500).
        return await self.reports.get(report_id)

    async def delete_report(self, *, report_id: int, user: User) -> None:
        report = await self.reports.get(report_id)
        is_admin = (user.role or "").lower() == "admin"
        if not report or (not is_admin and report.user_id != user.id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Обращение не найдено",
            )
        await self.reports.delete(report)
        await self.db.commit()