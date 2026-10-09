# backend/app/services/geo.py
"""Гео-примитивы: координаты и PostGIS-выражения. Чистые хелперы без бизнес-логики."""
from geoalchemy2.functions import ST_MakePoint, ST_SetSRID

SRID = 4326


def point_ewkt(lat: float, lon: float) -> str:
    """Точка в EWKT с явным SRID. PostGIS ждёт порядок (lon lat)."""
    return f"SRID={SRID};POINT({lon} {lat})"


def make_point(lat: float, lon: float):
    """SQL-выражение POINT для запросов PostGIS (ST_Contains и т.п.)."""
    return ST_SetSRID(ST_MakePoint(lon, lat), SRID)