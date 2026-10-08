# backend/app/routers/feedback.py
"""HTTP-слой опросов (surveys). Жалобы вынесены в routers/reports.py."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, RoleChecker
from app.models.users import User
from app.models.surveys import Survey, Question, QuestionOption, SurveyAnswer
from app.schemas.surveys import SurveyCreate, SurveyOut, SurveyAnswersSubmit

router = APIRouter(prefix="/api/v1/feedback", tags=["Surveys"])

allow_residents = Depends(get_current_user)
allow_authors = Depends(RoleChecker(allowed_roles=["author", "admin"]))

# --- БЛОК ОПРОСОВ (SURVEYS) ---
# (тело опросов без изменений - рефакторим на этапе сущности #2)

@router.post("/surveys", response_model=SurveyOut, status_code=status.HTTP_201_CREATED)
async def create_survey(survey_data: SurveyCreate, db: AsyncSession = Depends(get_db), _=allow_authors):
    """Конструктор: создание нового опроса с вопросами и вариантами ответов (Доступ: Автор, Админ)."""
    new_survey = Survey(title=survey_data.title, description=survey_data.description, is_active=survey_data.is_active)
    db.add(new_survey)
    await db.commit()

    for q_data in survey_data.questions:
        new_q = Question(survey_id=new_survey.id, text=q_data.text, question_type=q_data.question_type)
        db.add(new_q)
        await db.commit()

        for opt_data in q_data.options:
            new_opt = QuestionOption(question_id=new_q.id, text=opt_data.text)
            db.add(new_opt)

    await db.commit()

    result = await db.execute(
        select(Survey)
        .where(Survey.id == new_survey.id)
        .options(selectinload(Survey.questions).selectinload(Question.options))
    )
    return result.scalars().one()

@router.get("/surveys", response_model=list[SurveyOut])
async def get_active_surveys(db: AsyncSession = Depends(get_db)):
    """Лента жителя: получение всех активных экологических опросов."""
    result = await db.execute(
        select(Survey)
        .where(Survey.is_active == True)
        .options(selectinload(Survey.questions).selectinload(Question.options))
    )
    return result.scalars().all()

@router.patch("/surveys/{id}", status_code=status.HTTP_200_OK)
async def update_survey(id: int, is_active: bool, db: AsyncSession = Depends(get_db), _=allow_authors):
    """Изменение статуса активности опроса — запуск / деактивация (Update)."""
    result = await db.execute(select(Survey).where(Survey.id == id))
    survey = result.scalars().first()
    if not survey:
        raise HTTPException(status_code=404, detail="Опрос не найден")
    survey.is_active = is_active
    await db.commit()
    return {"message": "Статус опроса успешно изменен"}

@router.delete("/surveys/{id}", status_code=status.HTTP_200_OK)
async def delete_survey(id: int, db: AsyncSession = Depends(get_db), _=allow_authors):
    """Полное каскадное удаление опроса и всех вложенных вопросов из БД (Delete)."""
    result = await db.execute(select(Survey).where(Survey.id == id))
    survey = result.scalars().first()
    if not survey:
        raise HTTPException(status_code=404, detail="Опрос не найден")
    await db.delete(survey)
    await db.commit()
    return {"message": "Опрос успешно удален"}

@router.post("/surveys/{id}/answers", status_code=status.HTTP_201_CREATED)
async def submit_survey_answers(id: int, data: SurveyAnswersSubmit, db: AsyncSession = Depends(get_db), current_user: User = allow_residents):
    """Сдача опроса жителем. Принимает дерево выбранных опций."""
    for ans in data.answers:
        new_answer = SurveyAnswer(
            user_id=current_user.id,
            question_id=ans.question_id,
            option_id=ans.option_id,
            text_answer=ans.text_answer
        )
        db.add(new_answer)
    await db.commit()
    return {"status": "success", "message": "Ваши ответы успешно зарегистрированы"}