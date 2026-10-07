# backend/app/schemas/incidents.py
from datetime import datetime
from pydantic import BaseModel, Field

class IncidentUpdateStatus(BaseModel):
    """Схема для смены статуса инцидента оператором"""
    status: str = Field(..., description="Новый статус: IN_PROGRESS, RESOLVED")
    operator_comment: str | None = Field(None, max_length=1000, description="Комментарий по ходу устранения")

class IncidentOut(BaseModel):
    id: int
    district_id: int
    title: str
    status: str
    confidence_rate: float
    operator_comment: str | None
    created_at: datetime
    resolved_at: datetime | None
    
    # Сводные списки ID, чтобы фронтенд понимал, какие датчики и жалобы привязаны к аварии
    report_ids: list[int] = []
    sensor_ids: list[int] = []

    class Config:
        from_attributes = True
