# backend/app/schemas/feedback.py
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, model_validator

class ReportAttachmentSchema(BaseModel):
    id: int
    url: str

    class Config:
        from_attributes = True

class ReportCreate(BaseModel):
    """Данные для создания жалобы (тело запроса POST /reports)."""
    category: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=5, max_length=1000)
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
    """Жалоба в ответе API. location собирается из lat/lon модели Report."""
    id: int
    user_id: int
    district_id: int | None
    category: str
    description: str
    status: str
    created_at: datetime
    attachments: list[ReportAttachmentSchema] = []

    lat: float = Field(exclude=True)
    lon: float = Field(exclude=True)
    location: list[float] = []

    @model_validator(mode="after")
    def fill_location(self) -> "ReportOut":
        """Собираем [lat, lon] для фронтенда из реальных координат точки."""
        self.location = [self.lat, self.lon]
        return self


    class Config:
        from_attributes = True
