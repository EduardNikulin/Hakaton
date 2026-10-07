# backend/app/schemas/sensors.py
from datetime import datetime
from pydantic import BaseModel, Field, model_validator

class SensorSchema(BaseModel):
    """Датчик в ответе API. location собирается из lat/lon модели Sensor."""
    id: int
    district_id: int | None
    name: str
    sensor_type: str  # air или water
    status: str

    lat: float = Field(exclude=True)
    lon: float = Field(exclude=True)
    location: list[float] = []

    @model_validator(mode="after")
    def fill_location(self) -> "SensorSchema":
        """Собираем [lat, lon] для маркера на карте из реальной геометрии."""
        self.location = [self.lat, self.lon]
        return self

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
