# backend/app/routers/incidents.py
"""HTTP-слой инцидентов. Только приём запроса и вызов сервиса - никакого SQL.
URL-ы сохранены: /api/v1/incidents
Связные данные (report_ids/sensor_ids) маппятся в сервисе — не в роутере."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, RoleChecker
from app.schemas.incidents import IncidentOut, IncidentUpdateStatus
from app.services.incident_service import IncidentService

router = APIRouter(prefix="/api/v1/incidents", tags=["Incidents Dispatcher Board"])

allow_operators = Depends(RoleChecker(allowed_roles=["admin"]))


def _attach_ids(incident) -> IncidentOut:
    """Маппит связанные сущности в плоские массивы ID для схемы Pydantic."""
    if incident is None:
        return None
    incident.report_ids = [r.id for r in incident.reports]
    incident.sensor_ids = [s.id for s in incident.sensors]
    return incident


# ── Чтение ─────────────────────────────────────────────────────────

@router.get("", response_model=list[IncidentOut])
async def get_all_incidents(
    status_filter: str | None = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Список всех инцидентов в городе (для доски оператора или слоя на карте)."""
    incidents = await IncidentService(db).list_all(status_filter)
    return [_attach_ids(i) for i in incidents]


@router.get("/{id}", response_model=IncidentOut)
async def get_incident_details(
    id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Детальная карточка инцидента: завязанные датчики и жалобы жителей."""
    incident = await IncidentService(db).get(id)
    return _attach_ids(incident)


@router.get("/{id}/timeline")
async def get_incident_timeline(
    id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """История событий по инциденту для построения временной шкалы."""
    return await IncidentService(db).get_timeline(id)


# ── CRUD (только операторы/админы) ─────────────────────────────────

@router.post("", response_model=IncidentOut, status_code=201, dependencies=[allow_operators])
async def create_manual_incident(
    district_id: int, title: str, db: AsyncSession = Depends(get_db),
):
    """Ручное создание инцидента оператором, если автоматика не сработала."""
    incident = await IncidentService(db).create_manual(district_id=district_id, title=title)
    return _attach_ids(incident)


@router.patch("/{id}/status", response_model=IncidentOut, dependencies=[allow_operators])
async def update_incident_status(
    id: int, data: IncidentUpdateStatus, db: AsyncSession = Depends(get_db),
):
    """Смена статуса инцидента оператором в ходе ликвидации аварии."""
    incident = await IncidentService(db).update_status(
        id, status=data.status, operator_comment=data.operator_comment,
    )
    return _attach_ids(incident)


@router.delete("/{id}", status_code=200, dependencies=[allow_operators])
async def delete_incident(id: int, db: AsyncSession = Depends(get_db)):
    """Удаление инцидента с доски (например, ложное срабатывание)."""
    await IncidentService(db).delete(id)
    return {"status": "success", "message": "Инцидент успешно удален с операционной панели"}