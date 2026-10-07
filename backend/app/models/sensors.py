from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, DateTime, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry
from app.database import Base


if TYPE_CHECKING:
    from app.models.core import District
    from app.models.incidents import Incident


class Sensor(Base):
    __tablename__ = "sensors"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    district_id: Mapped[Optional[int]] = mapped_column(ForeignKey("districts.id", ondelete="SET NULL"))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    sensor_type: Mapped[str] = mapped_column(String(50), nullable=False)
    location = mapped_column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE")

    district: Mapped[Optional["District"]] = relationship("District", back_populates="sensors")
    measurements: Mapped[List["SensorMeasurement"]] = relationship("SensorMeasurement", back_populates="sensor", cascade="all, delete-orphan")
    incidents: Mapped[List["Incident"]] = relationship("Incident", secondary="incident_sensors", back_populates="sensors")


class SensorMeasurement(Base):
    __tablename__ = "sensor_measurements"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sensor_id: Mapped[int] = mapped_column(ForeignKey("sensors.id", ondelete="CASCADE"), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    metric_name: Mapped[str] = mapped_column(String(50), nullable=False)
    quality_status: Mapped[str] = mapped_column(String(50), default="VALID")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    sensor: Mapped["Sensor"] = relationship("Sensor", back_populates="measurements")


class EcoIndexHistory(Base):
    __tablename__ = "eco_index_history"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    district_id: Mapped[int] = mapped_column(ForeignKey("districts.id", ondelete="CASCADE"), nullable=False)
    eci_score: Mapped[float] = mapped_column(Float, nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    district: Mapped["District"] = relationship("District", back_populates="eci_history")
