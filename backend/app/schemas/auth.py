# backend/app/schemas/auth.py
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Пароль не менее 6 символов")


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: str | None = None
    role: str | None = None


class UserOut(BaseModel):
    """Профиль пользователя в ответе API."""
    id: int
    email: str  # не EmailStr: в БД есть служебные адреса (например admin@ecocity.local)
    role: str
    is_active: bool
    full_name: str | None = None
    created_at: datetime | None = None
    notify_new_surveys: bool = True
    notify_results: bool = True
    notify_pollution: bool = False

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Частичное обновление профиля (имя и настройки уведомлений)."""
    full_name: str | None = Field(None, max_length=255)
    notify_new_surveys: bool | None = None
    notify_results: bool | None = None
    notify_pollution: bool | None = None


class PasswordChange(BaseModel):
    old_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)