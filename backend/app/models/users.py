from datetime import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base, utcnow


if TYPE_CHECKING:
    from app.models.feedback import Report
    from app.models.surveys import SurveyAnswer


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50), default="resident", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, server_default=func.now()
    )

    # Настройки уведомлений (локальные для фронта, но храним на бэке)
    notify_new_surveys: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default=text("true"), nullable=False
    )
    notify_results: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default=text("true"), nullable=False
    )
    notify_pollution: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("false"), nullable=False
    )

    reports: Mapped[List["Report"]] = relationship("Report", back_populates="user")
    answers: Mapped[List["SurveyAnswer"]] = relationship("SurveyAnswer", back_populates="user")