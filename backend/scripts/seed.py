"""
Заполнение базы демонстрационными данными EcoCity.

Запуск:
    cd ~/dev/Hakaton/backend
    python scripts/seed.py

Seed идемпотентный:
- существующий город не дублируется;
- существующие округа не дублируются;
- существующие пользователи не дублируются;
- существующие датчики не дублируются;
- демонстрационные измерения добавляются только для новых датчиков.

Важно:
официальное территориальное деление Калуги состоит из трёх округов:
Ленинский, Московский и Октябрьский.

Полигоны округов ниже являются демонстрационными геометриями
для работы PostGIS/ST_Contains и карты. Это не официальные
кадастровые границы.
"""

from __future__ import annotations

import asyncio
from pathlib import Path
import sys

from geoalchemy2.elements import WKTElement
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine


# Позволяем запускать:
# python scripts/seed.py
# находясь в backend/
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


from app.config import settings
from app.models.core import City, District
from app.models.feedback import Report
from app.models.incidents import Incident
from app.models.sensors import Sensor, SensorMeasurement
from app.models.users import User
from app.utils.security import hash_password


# ---------------------------------------------------------------------------
# Настройки
# ---------------------------------------------------------------------------

CITY_NAME = "Калуга"

# Пароли предназначены ТОЛЬКО для локального демо/хакатона.
# В production такие значения использовать нельзя.
SEED_PASSWORDS = {
    "resident": "Resident123!",
    "author": "Author123!",
    "admin": "Admin123!",
}


# ---------------------------------------------------------------------------
# Геометрии
# ---------------------------------------------------------------------------
#
# Калуга:
# приблизительный центр:
#   latitude  = 54.5293
#   longitude = 36.2754
#
# Координаты в WKT идут как:
#   POINT(longitude latitude)
#
# Для POLYGON:
#   POLYGON((lon lat, lon lat, ...))
#
# Геометрии сделаны непересекающимися и покрывают основную городскую
# территорию для демонстрации ST_Contains.
#
# Это DEMO-полигоны, а не официальные границы округов.
# ---------------------------------------------------------------------------

DISTRICTS = [
    {
        "name": "Ленинский округ",
        "eci_score": 72.5,
        "color_hex": "#22c55e",
        "polygon": (
            "POLYGON(("
            "36.2450 54.5450, "
            "36.2750 54.5550, "
            "36.3050 54.5480, "
            "36.3150 54.5250, "
            "36.3000 54.5050, "
            "36.2700 54.5050, "
            "36.2450 54.5200, "
            "36.2450 54.5450"
            "))"
        ),
    },
    {
        "name": "Московский округ",
        "eci_score": 61.0,
        "color_hex": "#f59e0b",
        "polygon": (
            "POLYGON(("
            "36.2050 54.5650, "
            "36.2450 54.5700, "
            "36.2750 54.5550, "
            "36.2450 54.5450, "
            "36.2200 54.5350, "
            "36.2000 54.5450, "
            "36.2050 54.5650"
            "))"
        ),
    },
    {
        "name": "Октябрьский округ",
        "eci_score": 48.5,
        "color_hex": "#ef4444",
        "polygon": (
            "POLYGON(("
            "36.2750 54.5550, "
            "36.3150 54.5480, "
            "36.3450 54.5300, "
            "36.3350 54.5000, "
            "36.3000 54.5050, "
            "36.3150 54.5250, "
            "36.2750 54.5550"
            "))"
        ),
    },
]


# ---------------------------------------------------------------------------
# Пользователи
# ---------------------------------------------------------------------------

USERS = [
    {
        "email": "resident@ecocity.local",
        "password": SEED_PASSWORDS["resident"],
        "role": "resident",
    },
    {
        "email": "author@ecocity.local",
        "password": SEED_PASSWORDS["author"],
        "role": "author",
    },
    {
        "email": "admin@ecocity.local",
        "password": SEED_PASSWORDS["admin"],
        "role": "admin",
    },
]


# ---------------------------------------------------------------------------
# Датчики
# ---------------------------------------------------------------------------
#
# Координаты расположены в разных частях Калуги и используются
# исключительно как демонстрационные точки городской сенсорной сети.
# ---------------------------------------------------------------------------

SENSORS = [
    {
        "name": "AIR-001 Центр",
        "sensor_type": "air",
        "lat": 54.5293,
        "lon": 36.2754,
        "status": "ACTIVE",
    },
    {
        "name": "AIR-002 Московская",
        "sensor_type": "air",
        "lat": 54.5468,
        "lon": 36.2462,
        "status": "ACTIVE",
    },
    {
        "name": "AIR-003 Грабцевское",
        "sensor_type": "air",
        "lat": 54.5255,
        "lon": 36.3160,
        "status": "ACTIVE",
    },
    {
        "name": "AIR-004 Правый берег",
        "sensor_type": "air",
        "lat": 54.5348,
        "lon": 36.3032,
        "status": "ACTIVE",
    },
    {
        "name": "AIR-005 Северный",
        "sensor_type": "air",
        "lat": 54.5542,
        "lon": 36.2285,
        "status": "ACTIVE",
    },
    {
        "name": "AIR-006 Терепец",
        "sensor_type": "air",
        "lat": 54.5110,
        "lon": 36.2505,
        "status": "ACTIVE",
    },
    {
        "name": "AIR-007 Анненки",
        "sensor_type": "air",
        "lat": 54.5138,
        "lon": 36.2915,
        "status": "ACTIVE",
    },
    {
        "name": "WATER-001 Ока Центр",
        "sensor_type": "water",
        "lat": 54.5160,
        "lon": 36.2710,
        "status": "ACTIVE",
    },
    {
        "name": "WATER-002 Ока Восток",
        "sensor_type": "water",
        "lat": 54.5100,
        "lon": 36.3150,
        "status": "ACTIVE",
    },
    {
        "name": "WATER-003 Ока Запад",
        "sensor_type": "water",
        "lat": 54.5220,
        "lon": 36.2350,
        "status": "ACTIVE",
    },
]


# ---------------------------------------------------------------------------
# Демонстрационные измерения
# ---------------------------------------------------------------------------

AIR_MEASUREMENTS = [
    ("pm25", 18.4),
    ("pm10", 31.7),
    ("no2", 24.2),
    ("co", 0.42),
    ("temperature", 11.8),
    ("humidity", 67.0),
    ("noise", 54.0),
]

WATER_MEASUREMENTS = [
    ("temperature", 10.7),
    ("ph", 7.3),
    ("turbidity", 2.4),
]


# ---------------------------------------------------------------------------
# Вспомогательные функции
# ---------------------------------------------------------------------------

def point_wkt(lat: float, lon: float) -> WKTElement:
    """Создаёт POINT с SRID 4326.

    GeoAlchemy/PostGIS ожидает:
        POINT(longitude latitude)
    """
    return WKTElement(
        f"POINT({lon} {lat})",
        srid=4326,
    )


def polygon_wkt(value: str) -> WKTElement:
    """Создаёт POLYGON с SRID 4326."""
    return WKTElement(value, srid=4326)


async def get_or_create_city(
    db: AsyncSession,
) -> City:
    result = await db.execute(
        select(City).where(City.name == CITY_NAME)
    )
    city = result.scalar_one_or_none()

    if city:
        print(f"[OK] Город уже существует: {city.name}")
        return city

    city = City(name=CITY_NAME)
    db.add(city)

    await db.flush()

    print(f"[+] Создан город: {city.name}")

    return city


async def get_or_create_district(
    db: AsyncSession,
    city: City,
    data: dict,
) -> District:
    result = await db.execute(
        select(District).where(
            District.city_id == city.id,
            District.name == data["name"],
        )
    )
    district = result.scalar_one_or_none()

    if district:
        print(f"[OK] Округ уже существует: {district.name}")
        return district

    district = District(
        city_id=city.id,
        name=data["name"],
        polygon=polygon_wkt(data["polygon"]),
        eci_score=data["eci_score"],
        color_hex=data["color_hex"],
    )

    db.add(district)

    await db.flush()

    print(f"[+] Создан округ: {district.name}")

    return district


async def get_or_create_user(
    db: AsyncSession,
    data: dict,
) -> User:
    result = await db.execute(
        select(User).where(User.email == data["email"])
    )
    user = result.scalar_one_or_none()

    if user:
        print(
            f"[OK] Пользователь уже существует: "
            f"{user.email} ({user.role})"
        )
        return user

    user = User(
        email=data["email"],
        hashed_password=hash_password(data["password"]),
        role=data["role"],
        is_active=True,
    )

    db.add(user)

    await db.flush()

    print(
        f"[+] Создан пользователь: "
        f"{user.email} ({user.role})"
    )

    return user


async def get_or_create_sensor(
    db: AsyncSession,
    data: dict,
    districts: list[District],
) -> Sensor:
    result = await db.execute(
        select(Sensor).where(
            Sensor.name == data["name"]
        )
    )
    sensor = result.scalar_one_or_none()

    if sensor:
        print(f"[OK] Датчик уже существует: {sensor.name}")
        return sensor

    # Определяем округ через простую проверку координат.
    # Для seed это не требует отдельного запроса ST_Contains.
    district = find_district_for_point(
        data["lat"],
        data["lon"],
        districts,
    )

    sensor = Sensor(
        district_id=district.id if district else None,
        name=data["name"],
        sensor_type=data["sensor_type"],
        location=point_wkt(
            data["lat"],
            data["lon"],
        ),
        status=data["status"],
    )

    db.add(sensor)

    await db.flush()

    district_name = district.name if district else "без округа"

    print(
        f"[+] Создан датчик: "
        f"{sensor.name} → {district_name}"
    )

    return sensor


def point_in_demo_polygon(
    lat: float,
    lon: float,
    polygon: str,
) -> bool:
    """Простейшая проверка для наших прямоугольных demo-полигонов.

    Нужна только для выбора district при seed.
    Реальная логика приложения продолжает использовать PostGIS.
    """

    # Извлекаем координаты из WKT.
    raw = polygon.removeprefix("POLYGON((").removesuffix("))")

    points = []

    for pair in raw.split(","):
        x, y = pair.strip().split()
        points.append((float(x), float(y)))

    min_lon = min(x for x, _ in points)
    max_lon = max(x for x, _ in points)
    min_lat = min(y for _, y in points)
    max_lat = max(y for _, y in points)

    return (
        min_lon <= lon <= max_lon
        and min_lat <= lat <= max_lat
    )


def find_district_for_point(
    lat: float,
    lon: float,
    districts: list[District],
) -> District | None:
    """Находит demo-округ по координатам."""

    for district, data in zip(districts, DISTRICTS):
        if point_in_demo_polygon(
            lat,
            lon,
            data["polygon"],
        ):
            return district

    return None


async def seed_measurements(
    db: AsyncSession,
    sensors: list[Sensor],
) -> None:
    """Добавляет по несколько измерений для каждого нового датчика."""

    for sensor in sensors:
        result = await db.execute(
            select(SensorMeasurement)
            .where(
                SensorMeasurement.sensor_id == sensor.id
            )
            .limit(1)
        )

        existing_measurement = result.scalar_one_or_none()

        if existing_measurement:
            print(
                f"[OK] Измерения уже есть: "
                f"{sensor.name}"
            )
            continue

        if sensor.sensor_type.lower() == "water":
            measurements = WATER_MEASUREMENTS
        else:
            measurements = AIR_MEASUREMENTS

        for metric_name, value in measurements:
            measurement = SensorMeasurement(
                sensor_id=sensor.id,
                value=value,
                metric_name=metric_name,
                quality_status="VALID",
            )

            db.add(measurement)

        print(
            f"[+] Добавлены измерения: "
            f"{sensor.name} ({len(measurements)})"
        )


async def seed_reports(
    db: AsyncSession,
    resident: User,
    author: User,
    districts: list[District],
) -> list[Report]:
    """Создаёт несколько демонстрационных жалоб."""

    reports_data = [
        {
            "user": resident,
            "category": "air",
            "description": (
                "Повышенная концентрация загрязняющих веществ "
                "в районе автомобильной дороги."
            ),
            "lat": 54.5293,
            "lon": 36.2754,
        },
        {
            "user": resident,
            "category": "water",
            "description": (
                "Обнаружено изменение цвета воды в районе Оки."
            ),
            "lat": 54.5160,
            "lon": 36.2710,
        },
        {
            "user": author,
            "category": "waste",
            "description": (
                "Несанкционированное складирование отходов "
                "на территории городской зоны."
            ),
            "lat": 54.5468,
            "lon": 36.2462,
        },
    ]

    created_reports: list[Report] = []

    for data in reports_data:
        result = await db.execute(
            select(Report).where(
                Report.user_id == data["user"].id,
                Report.description == data["description"],
            )
        )

        report = result.scalar_one_or_none()

        if report:
            print(
                f"[OK] Жалоба уже существует: "
                f"{report.description[:45]}..."
            )
            created_reports.append(report)
            continue

        district = find_district_for_point(
            data["lat"],
            data["lon"],
            districts,
        )

        report = Report(
            user_id=data["user"].id,
            district_id=district.id if district else None,
            category=data["category"],
            description=data["description"],
            location=point_wkt(
                data["lat"],
                data["lon"],
            ),
            status="NEW",
        )

        db.add(report)

        await db.flush()

        created_reports.append(report)

        print(
            f"[+] Создана жалоба: "
            f"{data['category']}"
        )

    return created_reports


async def seed_incidents(
    db: AsyncSession,
    districts: list[District],
    reports: list[Report],
    sensors: list[Sensor],
) -> None:
    """Создаёт несколько демонстрационных инцидентов."""

    incidents_data = [
        {
            "title": "Повышенное загрязнение воздуха",
            "district": districts[0],
            "confidence_rate": 91.5,
            "status": "CRITICAL",
            "operator_comment": (
                "Автоматически обнаружено по показаниям "
                "датчиков качества воздуха."
            ),
            "report": reports[0] if reports else None,
            "sensor": sensors[0] if sensors else None,
        },
        {
            "title": "Подозрение на загрязнение воды",
            "district": districts[2],
            "confidence_rate": 78.0,
            "status": "WARNING",
            "operator_comment": (
                "Требуется дополнительная проверка "
                "показаний водных датчиков."
            ),
            "report": reports[1] if len(reports) > 1 else None,
            "sensor": sensors[7] if len(sensors) > 7 else None,
        },
    ]

    for data in incidents_data:
        result = await db.execute(
            select(Incident).where(
                Incident.title == data["title"]
            )
        )

        incident = result.scalar_one_or_none()

        if incident:
            print(
                f"[OK] Инцидент уже существует: "
                f"{incident.title}"
            )
            continue

        incident = Incident(
            district_id=data["district"].id,
            title=data["title"],
            status=data["status"],
            confidence_rate=data["confidence_rate"],
            operator_comment=data["operator_comment"],
        )

        if data["report"] is not None:
            incident.reports.append(data["report"])

        if data["sensor"] is not None:
            incident.sensors.append(data["sensor"])

        db.add(incident)

        print(
            f"[+] Создан инцидент: "
            f"{incident.title}"
        )


# ---------------------------------------------------------------------------
# Основной seed
# ---------------------------------------------------------------------------

async def seed() -> None:
    print()
    print("=" * 70)
    print("EcoCity — database seed")
    print("=" * 70)
    print()

    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
    )

    session_factory = async_sessionmaker(
        engine,
        expire_on_commit=False,
    )

    async with session_factory() as db:
        try:
            # ---------------------------------------------------------------
            # 1. City
            # ---------------------------------------------------------------

            city = await get_or_create_city(db)

            # ---------------------------------------------------------------
            # 2. Districts
            # ---------------------------------------------------------------

            districts = []

            for district_data in DISTRICTS:
                district = await get_or_create_district(
                    db,
                    city,
                    district_data,
                )

                districts.append(district)

            # ---------------------------------------------------------------
            # 3. Users
            # ---------------------------------------------------------------

            users = {}

            for user_data in USERS:
                user = await get_or_create_user(
                    db,
                    user_data,
                )

                users[user_data["role"]] = user

            # ---------------------------------------------------------------
            # 4. Sensors
            # ---------------------------------------------------------------

            sensors = []

            for sensor_data in SENSORS:
                sensor = await get_or_create_sensor(
                    db,
                    sensor_data,
                    districts,
                )

                sensors.append(sensor)

            # ---------------------------------------------------------------
            # 5. Sensor measurements
            # ---------------------------------------------------------------

            await seed_measurements(
                db,
                sensors,
            )

            # ---------------------------------------------------------------
            # 6. Reports
            # ---------------------------------------------------------------

            reports = await seed_reports(
                db,
                resident=users["resident"],
                author=users["author"],
                districts=districts,
            )

            # ---------------------------------------------------------------
            # 7. Incidents
            # ---------------------------------------------------------------

            await seed_incidents(
                db,
                districts=districts,
                reports=reports,
                sensors=sensors,
            )

            # ---------------------------------------------------------------
            # Commit
            # ---------------------------------------------------------------

            await db.commit()

            print()
            print("=" * 70)
            print("SEED COMPLETED SUCCESSFULLY")
            print("=" * 70)
            print()
            print(f"City:      {city.name}")
            print(f"Districts: {len(districts)}")
            print(f"Sensors:   {len(sensors)}")
            print(f"Reports:   {len(reports)}")
            print()
            print("Demo users:")
            print()
            print("  resident@ecocity.local / Resident123!")
            print("  author@ecocity.local   / Author123!")
            print("  admin@ecocity.local    / Admin123!")
            print()
            print("Не использовать эти пароли в production.")
            print()

        except Exception:
            await db.rollback()
            raise

        finally:
            await db.close()

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())