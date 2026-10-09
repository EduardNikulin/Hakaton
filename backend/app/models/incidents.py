from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, DateTime, Float, Column, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base, utcnow

if TYPE_CHECKING:
    from app.models.feedback import Report
    from app.models.sensors import Sensor

incident_reports = Table(
    "incident_reports",
    Base.metadata,
    Column("incident_id", ForeignKey("incidents.id", ondelete="CASCADE"), primary_key=True),
    Column("report_id", ForeignKey("reports.id", ondelete="CASCADE"), primary_key=True)
)

incident_sensors = Table(
    "incident_sensors",
    Base.metadata,
    Column("incident_id", ForeignKey("incidents.id", ondelete="CASCADE"), primary_key=True),
    Column("sensor_id", ForeignKey("sensors.id", ondelete="CASCADE"), primary_key=True)
)


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    district_id: Mapped[int] = mapped_column(ForeignKey("districts.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="CRITICAL")
    confidence_rate: Mapped[float] = mapped_column(Float, default=100.0)
    operator_comment: Mapped[Optional[str]] = mapped_column(String(1000))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    reports: Mapped[List["Report"]] = relationship("Report", secondary=incident_reports, back_populates="incidents")
    sensors: Mapped[List["Sensor"]] = relationship("Sensor", secondary=incident_sensors, back_populates="incidents")