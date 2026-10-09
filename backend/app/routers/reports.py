# backend/app/routers/reports.py
"""HTTP-слой жалоб. Только приём запроса и вызов сервиса - никакого SQL."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.users import User
from app.schemas.feedback import ReportCreate, ReportOut, ReportUpdate
from app.services.report_service import ReportService

router = APIRouter(prefix="/api/v1/feedback/reports", tags=["Reports"])


@router.post("", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
async def create_report(
    report_data: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Создание жалобы жителем с автоопределением района (PostGIS)."""
    lat, lon = report_data.location
    service = ReportService(db)
    return await service.create_report(
        user=current_user,
        category=report_data.category,
        description=report_data.description,
        lat=lat,
        lon=lon,
    )


@router.get("", response_model=list[ReportOut])
async def get_all_reports(
    district_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Все жалобы города (с фильтром по району) для меток на карте."""
    return await ReportService(db).list_reports(district_id)


@router.get("/my", response_model=list[ReportOut])
async def get_my_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Личный кабинет: жалобы текущего пользователя."""
    return await ReportService(db).list_my_reports(current_user)


@router.patch("/{id}", response_model=ReportOut)
async def update_report(
    id: int,
    data: ReportUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Редактирование текста жалобы её автором."""
    return await ReportService(db).update_description(
        report_id=id, user=current_user, description=data.description
    )


@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_report(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Удаление жалобы автором или администратором."""
    await ReportService(db).delete_report(report_id=id, user=current_user)
    return {"status": "success", "message": "Жалоба успешно удалена из системы"}