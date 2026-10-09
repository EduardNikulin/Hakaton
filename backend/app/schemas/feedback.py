# backend/app/schemas/feedback.py
from datetime import datetime
from pydantic import BaseModel, Field, computed_field, field_validator

class ReportAttachmentSchema(BaseModel):
    id: int
    url: str

    class Config:
        from_attributes = True

class ReportCreate(BaseModel):
    """Данные для создания жалобы (тело запроса POST /reports)."""
    category: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=5, max_length=1000)
    # Ровно 2 числа: [широта, долгота]
    location: list[float] = Field(..., min_length=2, max_length=2)

    @field_validator("location")
    @classmethod
    def validate_coordinates(cls, v: list[float]) -> list[float]:
        lat, lon = v[0], v[1]
        if not (-90 <= lat <= 90):
            raise ValueError("Широта (latitude) должна быть в диапазоне от -90 до 90")
        if not (-180 <= lon <= 180):
            raise ValueError("Долгота (longitude) должна быть в диапазоне от -180 до 180")
        return v

class ReportOut(BaseModel):
    """Жалоба в ответе API. location вычисляется из lat/lon модели Report."""
    id: int
    user_id: int
    district_id: int | None
    category: str
    description: str
    status: str
    created_at: datetime
    attachments: list[ReportAttachmentSchema] = []

    # Координаты из column_property модели (ST_Y/ST_X геометрии); в JSON не попадают
    lat: float = Field(exclude=True)
    lon: float = Field(exclude=True)

    # computed_field не читается из ORM-объекта (там location - это геометрия WKBElement),
    # а собирается при отдаче ответа из lat/lon
    @computed_field
    @property
    def location(self) -> list[float]:
        """[широта, долгота] точки жалобы для фронтенда."""
        return [self.lat, self.lon]

    class Config:
        from_attributes = True