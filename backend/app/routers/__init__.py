# backend/app/routers/__init__.py
from app.routers.auth import router as auth_router
from app.routers.reports import router as reports_router
from app.routers.surveys import router as surveys_router
from app.routers.sensors import router as sensors_router
from app.routers.incidents import router as incidents_router
from app.routers.analytics import router as analytics_router
from app.routers.maps import router as maps_router