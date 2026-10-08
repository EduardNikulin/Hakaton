# backend/app/main.py
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import routers
from app.config import settings
from app.database import AsyncSessionLocal
from app.tasks.eci_calculator import recalculate_all_districts

# Логирование для проверки автоматического расчета ECI по времени
# logging.basicConfig(
#     level=logging.INFO,
#     format="%(asctime)s %(levelname)s %(name)s: %(message)s",
# )

logger = logging.getLogger("ecocity.eci")


async def _eci_recalc_loop() -> None:
    """Периодически пересчитывает ECI всех районов, чтобы карта 'жила'.

    Ошибка одной итерации не должна убивать цикл, поэтому всё в try/except.
    """
    interval = settings.eci_recalc_interval_seconds
    while True:
        try:
            async with AsyncSessionLocal() as db:
                summary = await recalculate_all_districts(db)
                logger.info("ECI recalculated for %d districts", len(summary))
        except Exception as exc:  # noqa: BLE001 - цикл должен выживать
            logger.warning("ECI recalc failed: %s", exc)
        await asyncio.sleep(interval)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Запускает фоновый автопересчёт ECI при старте приложения."""
    task: asyncio.Task | None = None
    if settings.eci_recalc_interval_seconds > 0:
        task = asyncio.create_task(_eci_recalc_loop())
        logger.info(
            "ECI auto-recalc enabled, every %d s",
            settings.eci_recalc_interval_seconds,
        )
    else:
        logger.info("ECI auto-recalc disabled")

    try:
        yield
    finally:
        if task is not None:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass


app = FastAPI(
    title="EcoCity API",
    description="Бэкенд платформы коллективного экологического мониторинга города (MVP)",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS: браузер запрещает allow_origins=["*"] вместе с allow_credentials=True.
# Поэтому перечисляем конкретные адреса фронтенда (Vite по умолчанию на 5173).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Подключаем роутеры к приложению FastAPI
app.include_router(routers.auth_router)
app.include_router(routers.feedback_router)
app.include_router(routers.reports_router)
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
