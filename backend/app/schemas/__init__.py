# backend/app/schemas/__init__.py
from app.schemas.auth import UserRegister, UserLogin, Token, TokenData
from app.schemas.core import CitySchema, EciStatsSchema, DistrictSchema, DistrictShortOut
from app.schemas.feedback import ReportAttachmentSchema, ReportCreate, ReportOut
from app.schemas.surveys import (
    QuestionOptionCreate, QuestionOptionOut,
    QuestionCreate, QuestionOut,
    SurveyCreate, SurveyOut,
    SingleAnswerSubmit, SurveyAnswersSubmit
)
from app.schemas.sensors import SensorSchema, MeasurementCreate, MeasurementHistoryOut
from app.schemas.incidents import IncidentUpdateStatus, IncidentOut
