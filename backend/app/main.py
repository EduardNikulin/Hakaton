# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import routers

app = FastAPI(
    title="EcoCity API",
    description="Бэкенд платформы коллективного экологического мониторинга города (MVP)",
    version="1.0.0"
)

# CORS: браузер запрещает allow_origins=["*"] вместе с allow_credentials=True.
# Поэтому перечисляем конкретные адреса фронтенда (Vite по умолчанию на 5173).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Подключаем роутеры к приложению FastAPI
app.include_router(routers.auth_router)
app.include_router(routers.feedback_router)
app.include_router(routers.sensors_router)
app.include_router(routers.incidents_router)
app.include_router(routers.analytics_router)
app.include_router(routers.maps_router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Добро пожаловать в EcoCity API. Проект готов к работе на хакатоне!",
        "docs_url": "/docs"  # Ссылка на автоматическую интерактивную документацию Swagger
    }
