# backend/app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings
from datetime import datetime, timezone

# Асинхронный движок для работы с PostgreSQL
engine = create_async_engine(settings.DATABASE_URL, echo=False)

# Фабрика сессий для обработки запросов
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

# Базовый класс для всех моделей проекта
class Base(DeclarativeBase):
    pass

def utcnow() -> datetime:
    """Время UTC без tzinfo (столбцы базы данных - это ВРЕМЕННЫЕ метки БЕЗ ЧАСОВОГО ПОЯСА)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

# Зависимость (Dependency) для внедрения сессии БД в роутеры FastAPI
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
