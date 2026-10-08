# backend/app/repositories/user_repository.py
"""Доступ к данным пользователей (users). Только SQL, без бизнес-логики."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.users import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: int) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def create(self, *, email: str, hashed_password: str, role: str = "resident") -> User:
        user = User(
            email=email, hashed_password=hashed_password, role=role, is_active=True,
        )
        self.db.add(user)
        await self.db.flush()  # получаем id, не завершая транзакцию
        return user