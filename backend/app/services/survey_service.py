# backend/app/services/survey_service.py
"""Бизнес-логика опросов: конструктор, лента, активность, сдача ответов."""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.surveys import Survey
from app.models.users import User
from app.repositories.survey_repository import SurveyRepository


class SurveyService:
    """Сценарии работы с опросами. Границы транзакций - здесь (commit)."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.surveys = SurveyRepository(db)

    async def create_survey(self, data, created_by: int | None = None) -> Survey:
        """Создать опрос с деревом вопросов и вариантов (один атомарный commit)."""
        survey = await self.surveys.create_survey(
            title=data.title, description=data.description,
            is_active=data.is_active, created_by=created_by,
        )
        await self.surveys.add_questions(survey.id, data.questions)
        await self.db.commit()
        return await self.surveys.get(survey.id)

    async def list_active(self) -> list[Survey]:
        return await self.surveys.list_active()

    

    async def list_by_creator(self, user_id: int) -> list[Survey]:
        return await self.surveys.list_by_creator(user_id)

    async def get_survey(self, survey_id: int) -> Survey:
        return await self._get_or_404(survey_id)

    async def set_active(self, survey_id: int, is_active: bool) -> None:
        survey = await self._get_or_404(survey_id)
        survey.is_active = is_active
        await self.db.commit()

    async def delete_survey(self, survey_id: int) -> None:
        survey = await self._get_or_404(survey_id)
        await self.surveys.delete(survey)
        await self.db.commit()

    async def submit_answers(self, user: User, answers: list) -> None:
        await self.surveys.add_answers(user_id=user.id, answers=answers)
        await self.db.commit()

    async def _get_or_404(self, survey_id: int) -> Survey:
        survey = await self.surveys.get(survey_id)
        if not survey:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Опрос не найден"
            )
        return survey