# backend/app/routers/feedback.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from geoalchemy2.functions import ST_Contains, ST_SetSRID, ST_MakePoint

from app.database import get_db
from app.dependencies import get_current_user, RoleChecker
from app.models.users import User
from app.models.core import District
from app.models.feedback import Report
from app.models.surveys import Survey, Question, QuestionOption, SurveyAnswer
from app.schemas.feedback import ReportCreate, ReportOut
from app.schemas.surveys import SurveyCreate, SurveyOut, SurveyAnswersSubmit

router = APIRouter(prefix="/api/v1/feedback", tags=["Feedback & Surveys"])

# Зависимости по ролям
allow_residents = Depends(get_current_user)
allow_authors = Depends(RoleChecker(allowed_roles=["author", "admin"]))
allow_admin = Depends(RoleChecker(allowed_roles=["admin"]))

# --- БЛОК ЖАЛОБ ЖИТЕЛЕЙ (REPORTS) ---

@router.post("/reports", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
async def create_report(report_data: ReportCreate, db: AsyncSession = Depends(get_db), current_user: User = allow_residents):
    """Создание жалобы жителем с автоопределением района через PostGIS ST_Contains."""
    lat, lon = report_data.location[0], report_data.location[1]
    # Создаем гео-точку в проекции WGS 84 (SRID 4326)
    geo_point = ST_SetSRID(ST_MakePoint(lon, lat), 4326)

    # Ищем, в какой полигон района попадает наша точка
    district_query = await db.execute(select(District).where(ST_Contains(District.polygon, geo_point)))
    district = district_query.scalars().first()
    district_id = district.id if district else None

    new_report = Report(
        user_id=current_user.id,
        district_id=district_id,
        category=report_data.category,
        description=report_data.description,
        # EWKT-строка: явный SRID, иначе PostGIS сохранит точку без привязки к системе координат
        location=f"SRID=4326;POINT({lon} {lat})",
        status="NEW",
    )
    db.add(new_report)
    await db.commit()

    # Повторный SELECT со связями: в async-режиме ленивая загрузка запрещена,
    # поэтому attachments и вычисляемые lat/lon подгружаем сразу (selectinload)
    result = await db.execute(
        select(Report)
        .where(Report.id == new_report.id)
        .options(selectinload(Report.attachments))
    )
    created_report = result.scalars().one()

    return ReportOut.model_validate(created_report)

@router.get("/reports", response_model=list[ReportOut])
async def get_all_reports(district_id: int | None = None, db: AsyncSession = Depends(get_db)):
    """Получение всех жалоб в городе для вывода меток на Яндекс Карту."""
    # selectinload сразу подтягивает вложения, иначе Pydantic упадет с MissingGreenlet
    query = select(Report).options(selectinload(Report.attachments))
    if district_id:
        query = query.where(Report.district_id == district_id)

    result = await db.execute(query)
    return result.scalars().all()

@router.get("/reports/my", response_model=list[ReportOut])
async def get_my_reports(db: AsyncSession = Depends(get_db), current_user: User = allow_residents):
    """Личный кабинет: список жалоб, отправленных текущим пользователем."""
    result = await db.execute(
        select(Report)
        .where(Report.user_id == current_user.id)
        .options(selectinload(Report.attachments))
    )
    return result.scalars().all()

@router.patch("/reports/{id}", response_model=ReportOut)
async def update_report(id: int, description: str, db: AsyncSession = Depends(get_db), current_user: User = allow_residents):
    """Редактирование текста жалобы её автором (Update)."""
    result = await db.execute(
        select(Report)
        .where(Report.id == id, Report.user_id == current_user.id)
        .options(selectinload(Report.attachments))
    )
    report = result.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Обращение не найдено или у вас нет прав на его редактирование")

    report.description = description
    await db.commit()
    return report

@router.delete("/reports/{id}", status_code=status.HTTP_200_OK)
async def delete_report(id: int, db: AsyncSession = Depends(get_db), current_user: User = allow_residents):
    """Удаление жалобы автором или администратором системы (Delete)."""
    query = select(Report).where(Report.id == id)
    # Регистронезависимо, как в RoleChecker: "Admin"/"ADMIN" тоже должны иметь права
    if (current_user.role or "").lower() != "admin":
        query = query.where(Report.user_id == current_user.id)

    result = await db.execute(query)
    report = result.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Обращение не найдено")

    await db.delete(report)
    await db.commit()
    return {"status": "success", "message": "Жалоба успешно удалена из системы"}

# --- БЛОК ОПРОСОВ (SURVEYS) ---

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

    # Повторный SELECT с деревом связей survey -> questions -> options
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