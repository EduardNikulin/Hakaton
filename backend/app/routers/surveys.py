# backend/app/routers/surveys.py
"""HTTP-слой опросов. Только приём запроса и вызов сервиса - никакого SQL.
Префикс сохранён (/api/v1/feedback/surveys) - фронтенд не ломается."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import RoleChecker, get_current_user
from app.models.users import User
from app.schemas.surveys import SurveyCreate, SurveyOut, SurveyAnswersSubmit
from app.services.survey_service import SurveyService

router = APIRouter(prefix="/api/v1/feedback/surveys", tags=["Surveys"])

allow_authors = Depends(RoleChecker(allowed_roles=["author", "admin"]))


@router.post("", response_model=SurveyOut, status_code=status.HTTP_201_CREATED)
async def create_survey(
    survey_data: SurveyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(allowed_roles=["author", "admin"])),
):
    """Конструктор: опрос с вопросами и вариантами (Доступ: Автор, Админ)."""
    return await SurveyService(db).create_survey(survey_data, created_by=current_user.id)

@router.get("", response_model=list[SurveyOut])
async def get_active_surveys(db: AsyncSession = Depends(get_db)):
    """Лента жителя: все активные опросы."""
    return await SurveyService(db).list_active()


@router.get("/my", response_model=list[SurveyOut])
async def get_my_surveys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(allowed_roles=["author", "admin"])),
):
    """Опросы, созданные текущим автором (Доступ: Автор, Админ)."""
    return await SurveyService(db).list_by_creator(current_user.id)


@router.get("/{id}", response_model=SurveyOut)
async def get_survey(id: int, db: AsyncSession = Depends(get_db)):
    """Детальная карточка опроса по id."""
    return await SurveyService(db).get_survey(id)


@router.patch("/{id}", status_code=status.HTTP_200_OK)
async def update_survey(
    id: int, is_active: bool,
    db: AsyncSession = Depends(get_db),
    _=allow_authors,
):
    """Запуск / деактивация опроса (Доступ: Автор, Админ)."""
    await SurveyService(db).set_active(id, is_active)
    return {"message": "Статус опроса успешно изменен"}


@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_survey(
    id: int,
    db: AsyncSession = Depends(get_db),
    _=allow_authors,
):
    """Каскадное удаление опроса с вопросами (Доступ: Автор, Админ)."""
    await SurveyService(db).delete_survey(id)
    return {"message": "Опрос успешно удален"}


@router.post("/{id}/answers", status_code=status.HTTP_201_CREATED)
async def submit_survey_answers(
    id: int,
    data: SurveyAnswersSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Сдача опроса жителем."""
    await SurveyService(db).submit_answers(current_user, data.answers)
    return {"status": "success", "message": "Ваши ответы успешно зарегистрированы"}