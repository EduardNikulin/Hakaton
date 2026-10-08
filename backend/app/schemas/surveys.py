# backend/app/schemas/surveys.py
from datetime import datetime
from pydantic import BaseModel, Field

# --- СХЕМЫ ВАРИАНТОВ ОТВЕТОВ ---
class QuestionOptionCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=255, description="Текст варианта ответа")

class QuestionOptionOut(BaseModel):
    id: int
    question_id: int
    text: str

    class Config:
        from_attributes = True

# --- СХЕМЫ ВОПРОСОВ ---
class QuestionCreate(BaseModel):
    text: str = Field(..., min_length=2, max_length=500, description="Текст вопроса")
    question_type: str = Field(..., description="Тип вопроса: single_choice, multi_choice, text")
    options: list[QuestionOptionCreate] = []

class QuestionOut(BaseModel):
    id: int
    survey_id: int
    text: str
    question_type: str
    options: list[QuestionOptionOut] = []

    class Config:
        from_attributes = True

# --- СХЕМЫ ОПРОСОВ ---
class SurveyCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255, description="Название опроса")
    description: str | None = Field(None, max_length=1000, description="Описание опроса")
    is_active: bool = True
    questions: list[QuestionCreate] = Field(..., min_length=1, description="Опрос должен содержать хотя бы один вопрос")

class SurveyOut(BaseModel):
    id: int
    title: str
    description: str | None
    is_active: bool
    created_at: datetime
    created_by: int | None = None
    questions: list[QuestionOut] = []

    class Config:
        from_attributes = True

# --- СХЕМЫ СДАЧИ ОТВЕТОВ ЖИТЕЛЯМИ ---
class SingleAnswerSubmit(BaseModel):
    question_id: int
    option_id: int | None = Field(None, description="ID выбранного варианта для тестов")
    text_answer: str | None = Field(None, max_length=1000, description="Текст ответа для открытых вопросов")

class SurveyAnswersSubmit(BaseModel):
    answers: list[SingleAnswerSubmit] = Field(..., min_length=1)
