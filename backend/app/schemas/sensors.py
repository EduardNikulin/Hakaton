# backend/app/schemas/sensors.py
from datetime import datetime
from pydantic import BaseModel, Field, computed_field, field_validator

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


class SensorCreate(BaseModel):
    """Данные для создания датчика (тело POST /sensors)."""
    name: str = Field(..., min_length=2, max_length=100)
    sensor_type: str = Field(..., description="Тип датчика: air или water")
    # Ровно 2 числа: [широта, долгота]
    location: list[float] = Field(..., min_length=2, max_length=2)
    # Если не указан - район определится автоматически через PostGIS ST_Contains
    district_id: int | None = None
    status: str = "ACTIVE"

    @field_validator("location")
    @classmethod
    def validate_coordinates(cls, v: list[float]) -> list[float]:
        lat, lon = v[0], v[1]
        if not (-90 <= lat <= 90):
            raise ValueError("Широта (latitude) должна быть в диапазоне от -90 до 90")
        if not (-180 <= lon <= 180):
            raise ValueError("Долгота (longitude) должна быть в диапазоне от -180 до 180")
        return v



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
