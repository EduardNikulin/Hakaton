# backend/app/services/incident_service.py
"""Бизнес-логика инцидентов: CRUD, таймлайн, смена статуса. Транзакции - здесь."""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.incidents import Incident
from app.models.feedback import Report
from app.repositories.incident_repository import IncidentRepository


class IncidentService:
    """Сценарии работы с инцидентами. Границы транзакций - здесь (commit)."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.incidents = IncidentRepository(db)

    # ── Чтение ──────────────────────────────────────────────────────

    async def list_all(self, status_filter: str | None = None) -> list[Incident]:
        return await self.incidents.list_all(status_filter)

    async def get(self, incident_id: int) -> Incident | None:
        return await self.incidents.get(incident_id)

    async def _get_or_404(self, incident_id: int) -> Incident:
        incident = await self.incidents.get(incident_id)
        if not incident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Инцидент не найден в системе",
            )
        return incident

    # ── Создание ────────────────────────────────────────────────────

    async def create_manual(
        self, *, district_id: int, title: str,
    ) -> Incident:
        """Ручное создание инцидента оператором."""
        incident = Incident(
            district_id=district_id,
            title=title,
            status="CRITICAL",
            confidence_rate=100.0,
        )
        return await self.incidents.create(incident)

    # ── Изменение статуса ───────────────────────────────────────────

    async def update_status(
        self,
        incident_id: int,
        *,
        status: str,
        operator_comment: str | None = None,
    ) -> Incident:
        incident = await self._get_or_404(incident_id)
        incident.status = status
        if operator_comment is not None:
            incident.operator_comment = operator_comment
        if status == "RESOLVED":
            from app.database import utcnow
            incident.resolved_at = utcnow()
        await self.incidents.commit()
        return await self.incidents.get(incident_id)

    # ── Удаление ────────────────────────────────────────────────────

    async def delete(self, incident_id: int) -> None:
        incident = await self._get_or_404(incident_id)
        await self.incidents.delete(incident)

    # ── Таймлайн ────────────────────────────────────────────────────

    async def get_timeline(self, incident_id: int) -> list[dict]:
        """Собирает историю событий инцидента в плоский список для таймлайна."""
        from app.database import utcnow

        incident = await self._get_or_404(incident_id)

        timeline = []

        if incident.created_at:
            timeline.append({
                "time": incident.created_at.isoformat(),
                "event": "Инцидент автоматически обнаружен системой",
                "type": "trigger",
            })

        if incident.operator_comment:
            timeline.append({
                "time": incident.created_at.isoformat(),
                "event": f"Комментарий оператора: {incident.operator_comment}",
                "type": "info",
            })

        if incident.resolved_at:
            timeline.append({
                "time": incident.resolved_at.isoformat(),
                "event": "Статус изменен на: УСТРАНЕНО. Инцидент закрыт",
                "type": "resolve",
            })

        return timeline