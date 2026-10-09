# backend/app/services/analytics_service.py
"""Бизнес-логика аналитических дашбордов. Транзакции - здесь."""
from app.repositories.analytics_repository import AnalyticsRepository
from app.services.eci import eci_color


class AnalyticsService:
    """Сценарии работы с аналитикой. Границы транзакций - здесь (commit)."""

    def __init__(self, db):
        self.db = db
        self.repo = AnalyticsRepository(db)

    # ── Глобальный дашборд ──────────────────────────────────────────

    async def get_dashboard_metrics(self) -> dict:
        active_incidents = await self.repo.count_active_incidents()
        total_reports = await self.repo.count_total_reports()

        best_name, best_score = await self.repo.get_best_district()
        worst_name, worst_score = await self.repo.get_worst_district()

        return {
            "active_incidents_count": active_incidents,
            "total_citizen_reports_count": total_reports,
            "cleanest_area": {"name": best_name, "score": best_score},
            "critical_area": {"name": worst_name, "score": worst_score},
        }

    # ── Корреляции ──────────────────────────────────────────────────

    async def get_correlations(self) -> dict:
        rows = await self.repo.get_correlations()

        correlations = []
        for row in rows:
            count = row["total_complaints"]
            factor = "Критический" if count > 10 else "Умеренный" if count > 3 else "Слабый"
            correlations.append({
                "district": row["district"],
                "feedback_category": row["feedback_category"],
                "total_complaints": count,
                "correlation_factor": factor,
                "impact_percentage": round(min(count * 8.5, 94.2), 1),
            })

        return {
            "metric_description": "Зависимость активности жалоб жителей от локации постов IoT мониторинга",
            "data": correlations,
        }

    # ── Пересчёт ECI ────────────────────────────────────────────────

    async def recalculate_eci(self) -> dict:
        """Пересчёт ECI всех районов. Вызывается из роутера POST /recalculate."""
        from app.tasks.eci_calculator import recalculate_all_districts
        summary = await recalculate_all_districts(self.db)
        return {
            "status": "ok",
            "districts_updated": len(summary),
            "details": summary,
        }