from typing import List, TYPE_CHECKING
from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry
from app.database import Base


if TYPE_CHECKING:
    from app.models.sensors import Sensor, EcoIndexHistory
    from app.models.feedback import Report


class City(Base):
    __tablename__ = "cities"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    districts: Mapped[List["District"]] = relationship(back_populates="city", cascade="all, delete-orphan")


class District(Base):
    __tablename__ = "districts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    city_id: Mapped[int] = mapped_column(ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    polygon = mapped_column(Geometry(geometry_type="POLYGON", srid=4326), nullable=False)
    eci_score: Mapped[float] = mapped_column(Float, default=50.0)
    color_hex: Mapped[str] = mapped_column(String(7), default="#34d399")

    city: Mapped["City"] = relationship(back_populates="districts")
    sensors: Mapped[List["Sensor"]] = relationship("Sensor", back_populates="district")
    reports: Mapped[List["Report"]] = relationship("Report", back_populates="district")
    eci_history: Mapped[List["EcoIndexHistory"]] = relationship("EcoIndexHistory", back_populates="district")
