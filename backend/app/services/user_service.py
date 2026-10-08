# backend/app/services/user_service.py
"""Бизнес-логика пользователей: регистрация, аутентификация, профиль, пароль."""
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.users import User
from app.repositories.user_repository import UserRepository
from app.utils.security import hash_password, verify_password


class UserService:
    """Сценарии работы с пользователями. Границы транзакций - здесь (commit)."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.users = UserRepository(db)

    async def register(self, *, email: str, password: str) -> User:
        """Регистрация нового жителя. Проверяет уникальность email."""
        existing = await self.users.get_by_email(email)
        if existing:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email уже зарегистрирован в системе",
            )
        try:
            user = await self.users.create(
                email=email, hashed_password=hash_password(password), role="resident",
            )
            await self.db.commit()
            await self.db.refresh(user)
            return user
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email уже зарегистрирован в системе",
            )

    async def authenticate(self, *, email: str, password: str) -> User:
        """Проверка учётных данных для выдачи JWT."""
        user = await self.users.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный email или пароль",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Учетная запись заблокирована",
            )
        return user

    async def update_profile(self, user: User, *, data) -> User:
        """Обновление имени и настроек уведомлений (частичное)."""
        if data.full_name is not None:
            user.full_name = data.full_name
        for field in ("notify_new_surveys", "notify_results", "notify_pollution"):
            value = getattr(data, field)
            if value is not None:
                setattr(user, field, value)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def change_password(self, user: User, *, old_password: str, new_password: str) -> None:
        """Смена пароля с проверкой старого."""
        if not verify_password(old_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Старый пароль неверен",
            )
        user.hashed_password = hash_password(new_password)
        await self.db.commit()