# backend/app/tasks/eci_calculator.py
"""Пересчёт ECI всех районов: агрегирует замеры и жалобы из БД,
обновляет District.eci_score/color_hex, пишет историю в EcoIndexHistory.

Расчёт метрик вынесен в app/services/eci_metrics.py — единый источник
и для карты, и для панели района (устраняет рассинхрон компонентов).
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.config import settings
from app.models.core import District
from app.models.sensors import EcoIndexHistory
from app.services.eci import compute_eci
from app.services.eci_metrics import district_eci_inputs


async def recalculate_all_districts(db: AsyncSession) -> list[dict]:
    """Пересчитывает ECI для каждого района. Возвращает сводку для ответа API."""
    result = await db.execute(select(District).order_by(District.id))
    districts = result.scalars().all()

    summary = []
    for district in districts:
        m = await district_eci_inputs(db, district.id, settings.eci_window_hours)

        score, color = compute_eci(
            air=m["avg_pm25"] if m["avg_pm25"] is not None else 10.0,
            water=m["avg_ph"] if m["avg_ph"] is not None else 7.5,
            citizen=m["complaints"],
            trend=m["trend"],
        )

        district.eci_score = score
        district.color_hex = color
        db.add(EcoIndexHistory(district_id=district.id, eci_score=score))

        summary.append({
            "district_id": district.id,
            "district": district.name,
            "eci_score": score,
            "color_hex": color,
            "avg_pm25": m["avg_pm25"],
            "avg_ph": m["avg_ph"],
            "complaints": m["complaints"],
        })

    await db.commit()
    return summary