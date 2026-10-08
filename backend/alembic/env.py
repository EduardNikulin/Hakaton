import asyncio
import sys
import os
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

# Добавляем текущую директорию (backend) в пути поиска модулей
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings
from app.models import Base
import geoalchemy2


config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection):
    # Функция-фильтр для исключения дублирования ГИС-индексов
        # Исключаем служебные таблицы PostGIS и Tiger Geocoder
    SERVICE_SCHEMAS = {"tiger", "tiger_data", "topology"}

    SERVICE_TABLES = {
        "spatial_ref_sys",
        "geometry_columns",
        "geography_columns",
        "raster_columns",
        "raster_overviews",
        "addr",
        "addrfeat",
        "bg",
        "county",
        "county_lookup",
        "countysub_lookup",
        "cousub",
        "direction_lookup",
        "edges",
        "faces",
        "featnames",
        "place",
        "place_lookup",
        "state",
        "state_lookup",
        "street_type_lookup",
        "secondary_unit_lookup",
        "state",
        "tract",
        "zcta5",
        "layer",
        "topology",
        "pagc_rules",
        "loader_lookuptables",
        "geocode_settings",
        "geocode_settings_default",
        "zip_state",
        "zip_state_loc",
        "loader_platform",
        "loader_variables",
        "tabblock",
        "zip_lookup",
        "zip_lookup_base",
        "tabblock20",
        "pagc_lex",
        "zip_lookup_all",
        "pagc_gaz",
    }

    def include_object(object, name, type_, reflected, compare_to):
        schema = getattr(object, "schema", None)

        # Служебные схемы и таблицы
        if schema in SERVICE_SCHEMAS:
            return False

        if type_ == "table" and name in SERVICE_TABLES:
            return False

        # Не сравниваем индексы служебных таблиц
        if type_ == "index":
            table = getattr(object, "table", None)
            if table is not None:
                if getattr(table, "schema", None) in SERVICE_SCHEMAS:
                    return False
                if table.name in SERVICE_TABLES:
                    return False

            # Сохраняем существующее исключение GIS-индексов
            if name and name.startswith("idx_"):
                return False

        return True

    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = settings.DATABASE_URL

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
