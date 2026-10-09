# backend/app/repositories/incident_repository.py
"""Доступ к данным инцидентов: запросы с отношениями reports/sensors."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.incidents import Incident


def _with_relations():
    """SELECT инцидента с загруженными связями (избавляет от lazy-load в async)."""
    return select(Incident).options(
        selectinload(Incident.reports),
        selectinload(Incident.sensors),
    )


class IncidentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_all(self, status_filter: str | None = None) -> list[Incident]:
        query = _with_relations()
        if status_filter:
            query = query.where(Incident.status == status_filter)
        result = await self.db.execute(query.order_by(Incident.created_at.desc()))
        return list(result.scalars().all())

    async def get(self, incident_id: int) -> Incident | None:
        result = await self.db.execute(_with_relations().where(Incident.id == incident_id))
        return result.scalars().first()

    async def get_plain(self, incident_id: int) -> Incident | None:
        """Инцидент без связей — для удаления/таймлайна, где связи не нужны."""
        result = await self.db.execute(select(Incident).where(Incident.id == incident_id))
        return result.scalars().first()

    async def create(self, incident: Incident) -> Incident:
        self.db.add(incident)
        await self.db.commit()
        await self.db.refresh(incident)
        return incident

    async def delete(self, incident: Incident) -> None:
        await self.db.delete(incident)
        await self.db.commit()

    async def commit(self) -> None:
        await self.db.commit()