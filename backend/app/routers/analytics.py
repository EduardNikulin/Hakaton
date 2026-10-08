# backend/app/routers/analytics.py
"""HTTP-слой аналитики. Только приём запроса и вызов сервиса - никакого SQL.
URL-ы сохранены: /api/v1/analytics
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import RoleChecker
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/v1/analytics", tags=["Global Analytics Dashboards"])

allow_analytics_viewers = Depends(RoleChecker(allowed_roles=["author", "admin"]))
allow_admin_only = Depends(RoleChecker(allowed_roles=["admin"]))


@router.post("/recalculate", dependencies=[allow_admin_only])
async def recalculate_eci(db: AsyncSession = Depends(get_db)):
    """Пересчёт ECI всех районов по свежим данным датчиков и жалоб."""
    return await AnalyticsService(db).recalculate_eci()


@router.get("/dashboard", dependencies=[allow_analytics_viewers])
async def get_global_dashboard_metrics(db: AsyncSession = Depends(get_db)):
    """Главные верхнеуровневые метрики города для административного дашборда."""
    return await AnalyticsService(db).get_dashboard_metrics()


@router.get("/correlations", dependencies=[allow_analytics_viewers])
async def get_environmental_correlations(db: AsyncSession = Depends(get_db)):
    """Зависимость жалоб от локаций датчиков (группировка по районам)."""
    return await AnalyticsService(db).get_correlations()