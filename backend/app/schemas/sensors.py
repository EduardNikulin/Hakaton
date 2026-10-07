# backend/app/schemas/sensors.py
from datetime import datetime
from pydantic import BaseModel, Field, computed_field

class SensorSchema(BaseModel):
    """Датчик в ответе API. location вычисляется из lat/lon модели Sensor."""
    id: int
    district_id: int | None
    name: str
    sensor_type: str  # air или water
    status: str

    # Координаты из column_property модели (ST_Y/ST_X геометрии); в JSON не попадают
    lat: float = Field(exclude=True)
    lon: float = Field(exclude=True)

    # computed_field не читается из ORM-объекта (там location - это геометрия WKBElement),
    # а собирается при отдаче ответа из lat/lon
    @computed_field
    @property
    def location(self) -> list[float]:
        """[широта, долгота] датчика для маркера на карте."""
        return [self.lat, self.lon]

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