# backend/app/schemas/core.py
from pydantic import BaseModel, Field

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
