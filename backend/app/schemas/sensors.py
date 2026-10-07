# backend/app/schemas/sensors.py
from datetime import datetime
from pydantic import BaseModel, Field

class SensorSchema(BaseModel):
    id: int
    district_id: int | None
    name: str
    sensor_type: str  # air или water
    location: list[float] = Field(..., description="Координаты датчика [lat, lon] для маркера на карте")
    status: str

    class Config:
        from_attributes = True

class MeasurementCreate(BaseModel):
    """Схема, которую асинхронно бомбардирует IoT-симулятор"""
    sensor_id: int
    value: float
    metric_name: str  # PM2.5, CO2, pH, etc.
    quality_status: str = "VALID"

class MeasurementHistoryOut(BaseModel):
    id: int
    sensor_id: int
    value: float
    metric_name: str
    quality_status: str
    created_at: datetime

    class Config:
        from_attributes = True
