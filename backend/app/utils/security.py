from datetime import datetime, timedelta
import hashlib

import bcrypt
from jose import jwt

from app.config import settings


def _prepare_password(password: str) -> bytes:
    """Подготавливает пароль для bcrypt без ограничения в 72 байта."""
    return hashlib.sha256(password.encode("utf-8")).digest()


def hash_password(password: str) -> str:
    """Генерация безопасного хэша из сырого пароля."""
    password_bytes = _prepare_password(password)
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка соответствия сырого пароля хэшу из базы данных."""
    password_bytes = _prepare_password(plain_password)
    return bcrypt.checkpw(
        password_bytes,
        hashed_password.encode("utf-8"),
    )


def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
) -> str:
    """Создание JWT-токена доступа с зашитыми данными сессии."""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

    return encoded_jwt