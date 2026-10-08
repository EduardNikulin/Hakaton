# backend/app/routers/auth.py
"""HTTP-слой аутентификации и профиля. Логика - в UserService, здесь только приём запроса."""
from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.users import User
from app.schemas.auth import UserRegister, Token, UserOut, UserUpdate, PasswordChange
from app.services.user_service import UserService
from app.utils.security import create_access_token

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Регистрация нового пользователя в роли Жителя (resident)."""
    user = await UserService(db).register(email=user_data.email, password=user_data.password)
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
async def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Авторизация по OAuth2 (form-data) с выдачей JWT-токена."""
    user = await UserService(db).authenticate(
        email=form_data.username, password=form_data.password,
    )
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """Профиль текущего авторизованного пользователя."""
    return current_user


@router.patch("/me", response_model=UserOut)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Обновление профиля: имя и настройки уведомлений."""
    return await UserService(db).update_profile(current_user, data=data)


@router.post("/me/password", status_code=status.HTTP_200_OK)
async def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Смена пароля текущего пользователя."""
    await UserService(db).change_password(
        current_user, old_password=data.old_password, new_password=data.new_password,
    )
    return {"status": "success", "message": "Пароль успешно изменён"}