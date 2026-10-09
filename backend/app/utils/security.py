# backend/app/utils/security.py
from datetime import datetime, timedelta, timezone
import base64
import hashlib

import bcrypt
from jose import jwt

from app.config import settings


def _prepare_password(password: str) -> bytes:
    """Готовим пароль для bcrypt: SHA-256 + base64.
    base64 нужен, чтобы в байтах пароля не было нулевых байт —
    bcrypt обрезает пароль по первому нулю, что ослабляло бы хэш."""
    return base64.b64encode(hashlib.sha256(password.encode("utf-8")).digest())


def hash_password(password: str) -> str:
    """Генерация безопасного хэша из сырого пароля."""
    return bcrypt.hashpw(_prepare_password(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка соответствия сырого пароля хэшу из базы данных."""
    return bcrypt.checkpw(_prepare_password(plain_password), hashed_password.encode("utf-8"))


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Создание JWT-токена доступа с зашитыми данными сессии."""
    to_encode = data.copy()
    # datetime.utcnow() устарел; берем текущее время в UTC без tzinfo (столбцы БД без часового пояса)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)