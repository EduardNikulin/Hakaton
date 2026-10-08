# backend/app/repositories/survey_repository.py
"""Доступ к данным опросов (surveys/questions/options/answers). Только SQL."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.surveys import Question, QuestionOption, Survey, SurveyAnswer


class SurveyRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_survey(
        self, *, title: str, description: str | None, is_active: bool,
        created_by: int | None = None,
    ) -> Survey:
        survey = Survey(
            title=title, description=description, is_active=is_active, created_by=created_by,
        )
        self.db.add(survey)
        await self.db.flush()  # получаем id до commit
        return survey

    async def add_questions(self, survey_id: int, questions: list) -> None:
        """Создаёт вопросы с вариантами ответов. questions - список QuestionCreate."""
        for q_data in questions:
            question = Question(
                survey_id=survey_id, text=q_data.text, question_type=q_data.question_type
            )
            self.db.add(question)
            await self.db.flush()  # нужен id вопроса для вариантов
            for opt_data in q_data.options:
                self.db.add(QuestionOption(question_id=question.id, text=opt_data.text))

    async def get(self, survey_id: int) -> Survey | None:
        # selectinload обязателен: в async ленивая загрузка связей запрещена
        result = await self.db.execute(
            select(Survey)
            .where(Survey.id == survey_id)
            .options(selectinload(Survey.questions).selectinload(Question.options))
        )
        return result.scalars().first()

    async def list_active(self) -> list[Survey]:
        result = await self.db.execute(
            select(Survey)
            .where(Survey.is_active == True)  # noqa: E712
            .options(selectinload(Survey.questions).selectinload(Question.options))
        )
        return list(result.scalars().all())

    async def list_by_creator(self, user_id: int) -> list[Survey]:
        result = await self.db.execute(
            select(Survey)
            .where(Survey.created_by == user_id)
            .options(selectinload(Survey.questions).selectinload(Question.options))
        )
        return list(result.scalars().all())

    async def delete(self, survey: Survey) -> None:
        await self.db.delete(survey)  # вопросы/варианты удаляются каскадом (ORM cascade)

    async def add_answers(self, user_id: int, answers: list) -> None:
        """Массовая вставка ответов. answers - список SingleAnswerSubmit."""
        for ans in answers:
            self.db.add(SurveyAnswer(
                user_id=user_id,
                question_id=ans.question_id,
                option_id=ans.option_id,
                text_answer=ans.text_answer,
            ))