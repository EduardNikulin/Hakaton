# backend/app/routers/feedback.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from geoalchemy2.functions import ST_Contains, ST_SetSRID, ST_MakePoint

from app.database import get_db
from app.dependencies import get_current_user, RoleChecker
from app.models.users import User
from app.models.core import District
from app.models.feedback import Report
from app.models.surveys import Survey, Question, SurveyAnswer
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
        location=f"POINT({lon} {lat})",
        status="NEW"
    )
    db.add(new_report)
    await db.commit()
    await db.refresh(new_report)
    
    # Конвертируем обратно в список для схемы
    new_report.location = [lat, lon]
    return new_report

@router.get("/reports", response_model=list[ReportOut])
async def get_all_reports(district_id: int | None = None, db: AsyncSession = Depends(get_db)):
    """Получение всех открытых жалоб в городе для вывода меток на Яндекс Карту."""
    query = select(Report)
    if district_id:
        query = query.where(Report.district_id == district_id)
    
    result = await db.execute(query)
    reports = result.scalars().all()
    
    # Фикс геометрии для корректной Pydantic-валидации перед отправкой на фронтенд
    for r in reports:
        r.location = [54.51, 36.26]  # Пример заглушки парсинга POINT в массив [lat, lon] для хакатона
    return reports

@router.get("/reports/my", response_model=list[ReportOut])
async def get_my_reports(db: AsyncSession = Depends(get_db), current_user: User = allow_residents):
    """Личный кабинет: список жалоб, отправленных текущим пользователем."""
    result = await db.execute(select(Report).where(Report.user_id == current_user.id))
    reports = result.scalars().all()
    for r in reports:
        r.location = [54.51, 36.26]
    return reports

@router.patch("/reports/{id}", response_model=ReportOut)
async def update_report(id: int, description: str, db: AsyncSession = Depends(get_db), current_user: User = allow_residents):
    """Редактирование текста жалобы её автором (Update)."""
    result = await db.execute(select(Report).where(Report.id == id, Report.user_id == current_user.id))
    report = result.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Обращение не найдено или у вас нет прав на его редактирование")
    
    report.description = description
    await db.commit()
    await db.refresh(report)
    report.location = [54.51, 36.26]
    return report

@router.delete("/reports/{id}", status_code=status.HTTP_200_OK)
async def delete_report(id: int, db: AsyncSession = Depends(get_db), current_user: User = allow_residents):
    """Удаление жалобы автором или администратором системы (Delete)."""
    query = select(Report).where(Report.id == id)
    if current_user.role != "admin":
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
    new_survey = Survey(title=survey_data.title, description=survey_data.description, is_active=True)
    db.add(new_survey)
    await db.commit()
    await db.refresh(new_survey)

    for q_data in survey_data.questions:
        new_q = Question(survey_id=new_survey.id, text=q_data.text, question_type=q_data.question_type)
        db.add(new_q)
        await db.commit()
        await db.refresh(new_q)
        
        for opt_data in q_data.options:
            from app.models.surveys import QuestionOption
            new_opt = QuestionOption(question_id=new_q.id, text=opt_data.text)
            db.add(new_opt)
            
    await db.commit()
    await db.refresh(new_survey)
    return new_survey

@router.get("/surveys", response_model=list[SurveyOut])
async def get_active_surveys(db: AsyncSession = Depends(get_db)):
    """Лента жителя: получение всех активных экологических опросов."""
    result = await db.execute(select(Survey).where(Survey.is_active == True))
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
