from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship, column_property
from geoalchemy2 import Geometry
from app.database import Base, utcnow

if TYPE_CHECKING:
    from app.models.users import User
    from app.models.core import District
    from app.models.incidents import Incident


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    district_id: Mapped[Optional[int]] = mapped_column(ForeignKey("districts.id", ondelete="SET NULL"))
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    location = mapped_column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="NEW")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)

    user: Mapped["User"] = relationship("User", back_populates="reports")
    district: Mapped[Optional["District"]] = relationship("District", back_populates="reports")
    attachments: Mapped[List["ReportAttachment"]] = relationship("ReportAttachment", back_populates="report", cascade="all, delete-orphan")
    incidents: Mapped[List["Incident"]] = relationship("Incident", secondary="incident_reports", back_populates="reports")

    # Координаты точки жалобы, вычисляемые из геометрии при каждом SELECT
    lat = column_property(func.ST_Y(location))
    lon = column_property(func.ST_X(location))


class ReportAttachment(Base):
    __tablename__ = "report_attachments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    url: Mapped[str] = mapped_column(String(512), nullable=False)

    report: Mapped["Report"] = relationship("Report", back_populates="attachments")
