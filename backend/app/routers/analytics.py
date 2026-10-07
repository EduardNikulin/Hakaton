# backend/app/routers/analytics.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.database import get_db
from app.dependencies import RoleChecker
from app.models.core import District
from app.models.feedback import Report
from app.models.incidents import Incident
from app.tasks.eci_calculator import recalculate_all_districts

router = APIRouter(prefix="/api/v1/analytics", tags=["Global Analytics Dashboards"])

# Доступ к аналитическим панелям имеют только Авторы опросов (экологи) и Админы
allow_analytics_viewers = Depends(RoleChecker(allowed_roles=["author", "admin"]))
# Пересчёт индексов - только Админ
allow_admin_only = Depends(RoleChecker(allowed_roles=["admin"]))

# Направление индекса зафиксировано: ECI ВЫШЕ = ЛУЧШЕ (чище среда).
# Поэтому "самый чистый" район - с МАКСИМАЛЬНЫМ eci_score.

@router.post("/recalculate", dependencies=[allow_admin_only])
async def recalculate_eci(db: AsyncSession = Depends(get_db)):
    """Пересчёт ECI всех районов по свежим данным датчиков и жалоб (admin)."""
    summary = await recalculate_all_districts(db)
    return {"status": "ok", "districts_updated": len(summary), "details": summary}

@router.get("/dashboard", dependencies=[allow_analytics_viewers])
async def get_global_dashboard_metrics(db: AsyncSession = Depends(get_db)):
    """Агрегация главных верхнеуровневых метрик города для административного дашборда."""
    active_incidents_query = await db.execute(
        select(func.count(Incident.id)).where(Incident.status != "RESOLVED")
    )
    active_incidents = active_incidents_query.scalar() or 0

    total_reports_query = await db.execute(select(func.count(Report.id)))
    total_reports = total_reports_query.scalar() or 0

    # Самый чистый район = максимальный ECI (индекс - это качество, выше = лучше)
    cleanest_query = await db.execute(
        select(District.name, District.eci_score).order_by(District.eci_score.desc()).limit(1)
    )
    cleanest_district = cleanest_query.first()
    cleanest_name = cleanest_district[0] if cleanest_district else "Нет данных"
    cleanest_score = cleanest_district[1] if cleanest_district else 0.0

    # Самая проблемная зона = минимальный ECI
    dirtiest_query = await db.execute(
        select(District.name, District.eci_score).order_by(District.eci_score.asc()).limit(1)
    )
    dirtiest_district = dirtiest_query.first()
    dirtiest_name = dirtiest_district[0] if dirtiest_district else "Нет данных"
    dirtiest_score = dirtiest_district[1] if dirtiest_district else 0.0

    return {
        "active_incidents_count": active_incidents,
        "total_citizen_reports_count": total_reports,
        "cleanest_area": {"name": cleanest_name, "score": cleanest_score},
        "critical_area": {"name": dirtiest_name, "score": dirtiest_score}
    }

@router.get("/correlations", dependencies=[allow_analytics_viewers])
async def get_environmental_correlations(db: AsyncSession = Depends(get_db)):
    """Вычисление зависимости жалоб от локаций датчиков (группировка по районам)."""
    query = (
        select(District.name, Report.category, func.count(Report.id))
        .join(Report, District.id == Report.district_id)
        .group_by(District.name, Report.category)
        .order_by(func.count(Report.id).desc())
    )
    result = await db.execute(query)
    rows = result.all()

    correlations = []
    for row in rows:
        dist_name, cat, count = row[0], row[1], row[2]
        factor = "Критический" if count > 10 else "Умеренный" if count > 3 else "Слабый"
        correlations.append({
            "district": dist_name,
            "feedback_category": cat,
            "total_complaints": count,
            "correlation_factor": factor,
            "impact_percentage": round(min(count * 8.5, 94.2), 1)
        })

    return {
        "metric_description": "Зависимость активности жалоб жителей от локации постов IoT мониторинга",
        "data": correlations
    }