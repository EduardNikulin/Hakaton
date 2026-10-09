# backend/app/schemas/core.py
from pydantic import BaseModel, Field, field_validator

class CitySchema(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class EciStatsSchema(BaseModel):
    """Схема объясняемости индекса района (компоненты ECI)"""
    air_score: float = Field(..., description="Вклад качества воздуха (0..100)")
    water_score: float = Field(..., description="Вклад качества водных ресурсов (0..100)")
    citizen_score: float = Field(..., description="Вклад жалоб и активности жителей (0..100)")
    trend_score: float = Field(..., description="Вклад динамики изменений (0..100)")

class DistrictSchema(BaseModel):
    id: int
    city_id: int
    name: str
    # Передаем фронтенду границы в формате GeoJSON Feature или сырого массива полигона Яндекс Карт
    polygon_geojson: dict = Field(..., description="Координаты границ района в формате GeoJSON для Яндекс Карт")
    eci_score: float
    color_hex: str

    class Config:
        from_attributes = True

class DistrictShortOut(BaseModel):
    """Упрощенная схема для быстрой отрисовки сетки карты"""
    id: int
    name: str
    eci_score: float
    color_hex: str

    class Config:
        from_attributes = True


class DistrictCreate(BaseModel):
    """Создание района. polygon - координаты в формате GeoJSON (кольца [lon, lat])."""
    name: str = Field(..., min_length=2, max_length=100)
    polygon: list[list[list[float]]] = Field(..., description="GeoJSON Polygon coordinates")
    city_id: int | None = None  # если не задан - первый город в БД
    color_hex: str | None = None

    @field_validator("polygon")
    @classmethod
    def validate_polygon(cls, v: list[list[list[float]]]) -> list[list[list[float]]]:
        if not v:
            raise ValueError("Полигон должен содержать хотя бы один контур")
        for ring in v:
            if len(ring) < 4:
                raise ValueError("Контур полигона должен содержать минимум 4 точки")
            if ring[0] != ring[-1]:
                raise ValueError("Контур должен быть замкнут: первая точка равна последней")
            for point in ring:
                if len(point) != 2:
                    raise ValueError("Каждая точка - пара [долгота, широта]")
                lon, lat = point
                if not (-180 <= lon <= 180) or not (-90 <= lat <= 90):
                    raise ValueError("Координаты вне допустимого диапазона")
        return v


class DistrictUpdate(BaseModel):
    """Частичное обновление района: имя, границы и/или цвет."""
    name: str | None = Field(None, min_length=2, max_length=100)
    polygon: list[list[list[float]]] | None = None
    color_hex: str | None = None

    @field_validator("polygon")
    @classmethod
    def validate_polygon(cls, v):
        if v is None:
            return v
        return DistrictCreate.validate_polygon(v)