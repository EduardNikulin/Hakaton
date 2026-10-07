# backend/app/routers/incidents.py
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, RoleChecker
from app.models.incidents import Incident
from app.schemas.incidents import IncidentOut, IncidentUpdateStatus

router = APIRouter(prefix="/api/v1/incidents", tags=["Incidents Dispatcher Board"])

# Ограничение по ролям: только Диспетчер (Админ) имеет право управлять инцидентами
allow_operators = Depends(RoleChecker(allowed_roles=["admin"]))
allow_all_auth = Depends(get_current_user)

@router.get("", response_model=list[IncidentOut])
async def get_all_incidents(status_filter: str | None = None, db: AsyncSession = Depends(get_db), _=allow_all_auth):
    """Получение списка всех инцидентов в городе (для доски оператора или слоя на карте)."""
    query = select(Incident).options(
        selectinload(Incident.reports),
        selectinload(Incident.sensors)
    )
    if status_filter:
        query = query.where(Incident.status == status_filter)
        
    result = await db.execute(query.order_by(Incident.created_at.desc()))
    incidents = result.scalars().all()
    
    # Маппим связанные сущности в плоские массивы ID для схемы Pydantic
    for inc in incidents:
        inc.report_ids = [r.id for r in inc.reports]
        inc.sensor_ids = [s.id for s in inc.sensors]
        
    return incidents

@router.get("/{id}", response_model=IncidentOut)
async def get_incident_details(id: int, db: AsyncSession = Depends(get_db), _=allow_all_auth):
    """Детальная карточка инцидента: вывод завязавшихся датчиков и жалоб жителей."""
    query = select(Incident).where(Incident.id == id).options(
        selectinload(Incident.reports),
        selectinload(Incident.sensors)
    )
    result = await db.execute(query)
    incident = result.scalars().first()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Инцидент не найден в системе")
        
    incident.report_ids = [r.id for r in incident.reports]
    incident.sensor_ids = [s.id for s in incident.sensors]
    return incident

@router.post("", response_model=IncidentOut, status_code=status.HTTP_201_CREATED)
async def create_manual_incident(district_id: int, title: str, db: AsyncSession = Depends(get_db), _=allow_operators):
    """Ручное создание инцидента оператором, если автоматика не сработала, но жалоб много."""
    new_incident = Incident(
        district_id=district_id,
        title=title,
        status="CRITICAL",
        confidence_rate=100.0,
        created_at=datetime.utcnow()
    )
    db.add(new_incident)
    await db.commit()
    await db.refresh(new_incident)
    new_incident.report_ids = []
    new_incident.sensor_ids = []
    return new_incident

@router.patch("/{id}/status", response_model=IncidentOut)
async def update_incident_status(id: int, data: IncidentUpdateStatus, db: AsyncSession = Depends(get_db), _=allow_operators):
    """Смена статуса инцидента оператором в ходе ликвидации экологической аварии (Update)."""
    query = select(Incident).where(Incident.id == id).options(
        selectinload(Incident.reports),
        selectinload(Incident.sensors)
    )
    result = await db.execute(query)
    incident = result.scalars().first()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Инцидент не найден")
        
    incident.status = data.status
    if data.operator_comment is not None:
        incident.operator_comment = data.operator_comment
        
    if data.status == "RESOLVED":
        incident.resolved_at = datetime.utcnow()
        
    await db.commit()
    await db.refresh(incident)
    
    incident.report_ids = [r.id for r in incident.reports]
    incident.sensor_ids = [s.id for s in incident.sensors]
    return incident

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_incident(id: int, db: AsyncSession = Depends(get_db), _=allow_operators):
    """Принудительное удаление инцидента с доски (например, ложное срабатывание датчика) (Delete)."""
    result = await db.execute(select(Incident).where(Incident.id == id))
    incident = result.scalars().first()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Инцидент не найден")
        
    await db.delete(incident)
    await db.commit()
    return {"status": "success", "message": "Инцидент успешно удален с операционной панели"}

@router.get("/{id}/timeline")
async def get_incident_timeline(id: int, db: AsyncSession = Depends(get_db), _=allow_all_auth):
    """Получение истории событий по инциденту для построения временной шкалы на фронтенде."""
    result = await db.execute(select(Incident).where(Incident.id == id))
    incident = result.scalars().first()
    if not incident:
        raise HTTPException(status_code=404, detail="Инцидент не найден")
        
    # Формируем красивый структурированный лог жизни инцидента для таймлайна
    timeline = [
        {"time": incident.created_at, "event": "Инцидент автоматически обнаружен системой", "type": "trigger"}
    ]
    if incident.operator_comment:
        timeline.append({"time": incident.created_at, "event": f"Комментарий оператора: {incident.operator_comment}", "type": "info"})
    if incident.resolved_at:
        timeline.append({"time": incident.resolved_at, "event": "Статус изменен на: УСТРАНЕНО. Инцидент закрыт", "type": "resolve"})
        
    return timeline
