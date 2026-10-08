import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database import get_db
from app.dependencies import get_current_user


# ─────────────────────────────────────────────────────────────────────────────
# MOCK USER для тестов авторизации
# ─────────────────────────────────────────────────────────────────────────────

def make_mock_user(email="test@test.com", role="resident", user_id=1, is_active=True):
    """Создаёт мок-объект пользователя."""
    user = MagicMock()
    user.id = user_id
    user.email = email
    user.role = role
    user.is_active = is_active
    # Новые поля профиля (см. UserOut)
    user.full_name = None
    user.created_at = None
    user.notify_new_surveys = True
    user.notify_results = True
    user.notify_pollution = False
    return user

# ─────────────────────────────────────────────────────────────────────────────
# MOCK DATABASE SESSION
# ─────────────────────────────────────────────────────────────────────────────

class MockScalarResult:
    """Мок для result.scalars()."""

    def __init__(self, items=None):
        self._items = items or []

    def first(self):
        return self._items[0] if self._items else None

    def all(self):
        return self._items

    def __iter__(self):
        return iter(self._items)


class MockResult:
    """
    Мок для результата db.execute().
    Поддерживает ВСЕ варианты использования SQLAlchemy:
    - result.scalars().first()
    - result.scalars().all()
    - result.all()  (используется в некоторых repository)
    - result.first()
    - result.unique()
    """

    def __init__(self, items=None):
        self._items = items or []
        self._scalar_result = MockScalarResult(self._items)

    def scalars(self):
        return self._scalar_result

    def scalar_one_or_none(self):
        return self._scalar_result.first()

    def first(self):
        return self._items[0] if self._items else None

    def all(self):
        return self._items

    def unique(self):
        return self

    def __iter__(self):
        return iter(self._items)


class MockAsyncSession:
    """
    Мок AsyncSession. Поддерживает все варианты вызовов:
    - db.execute() → MockResult
    - db.scalars() → MockScalarResult  (используется в некоторых repository)
    - db.commit()
    - db.refresh()
    - db.add()
    - db.delete()
    """

    def __init__(self):
        self._execute_return = None
        self._scalars_return = None
        self.added_objects = []

    async def execute(self, *args, **kwargs):
        return self._execute_return or MockResult()

    async def scalars(self, *args, **kwargs):
        """Поддержка db.scalars() напрямую (без execute)."""
        return self._scalars_return or MockScalarResult()

    async def commit(self):
        pass

    async def flush(self):
        """Поддержка db.flush() — используется в repositories."""
        pass

    async def refresh(self, obj, *args, **kwargs):
        if not hasattr(obj, 'id') or obj.id is None:
            obj.id = 1
        if not hasattr(obj, 'created_at'):
            from datetime import datetime, timezone
            obj.created_at = datetime.now(timezone.utc)

    def add(self, obj):
        self.added_objects.append(obj)
        if not hasattr(obj, 'id') or obj.id is None:
            obj.id = 1

    async def delete(self, obj):
        pass

    def set_return(self, items=None):
        """Установить что вернёт следующий execute()."""
        self._execute_return = MockResult(items)

    def set_scalars_return(self, items=None):
        """Установить что вернёт следующий scalars()."""
        self._scalars_return = MockScalarResult(items)

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        pass


def create_mock_session():
    return MockAsyncSession()


# ─────────────────────────────────────────────────────────────────────────────
# FIXTURES
# ─────────────────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture(autouse=True)
def override_db():
    """Подменяет get_db на мок-сессию для ВСЕХ тестов."""
    mock_session = create_mock_session()

    async def mock_get_db():
        yield mock_session

    app.dependency_overrides[get_db] = mock_get_db
    yield mock_session
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client():
    """Async HTTP клиент для тестирования."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def resident_client(client: AsyncClient):
    """Клиент с авторизацией resident."""
    mock_user = make_mock_user(role="resident")
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield client
    app.dependency_overrides.pop(get_current_user, None)


@pytest_asyncio.fixture
async def author_client(client: AsyncClient):
    """Клиент с авторизацией author."""
    mock_user = make_mock_user(email="author@test.com", role="author")
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield client
    app.dependency_overrides.pop(get_current_user, None)


@pytest_asyncio.fixture
async def admin_client(client: AsyncClient):
    """Клиент с авторизацией admin."""
    mock_user = make_mock_user(email="admin@test.com", role="admin")
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield client
    app.dependency_overrides.pop(get_current_user, None)


# ─────────────────────────────────────────────────────────────────────────────
# 1. ROOT / HEALTH CHECK
# ─────────────────────────────────────────────────────────────────────────────

class TestRootEndpoint:
    """Smoke-тесты корневого endpoint'а."""

    @pytest.mark.asyncio
    async def test_root_returns_200(self, client: AsyncClient):
        """GET / — сервер отвечает 200."""
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        assert "message" in data
        assert "docs_url" in data

    @pytest.mark.asyncio
    async def test_docs_endpoint_accessible(self, client: AsyncClient):
        """GET /docs — Swagger UI доступен."""
        response = await client.get("/docs")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_openapi_schema_available(self, client: AsyncClient):
        """GET /openapi.json — OpenAPI схема доступна."""
        response = await client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "paths" in data
        assert "info" in data
        assert data["info"]["title"] == "EcoCity API"


# ─────────────────────────────────────────────────────────────────────────────
# 2. AUTHENTICATION
# ─────────────────────────────────────────────────────────────────────────────

class TestAuthentication:
    """Smoke-тесты модуля аутентификации."""

    @pytest.mark.asyncio
    async def test_register_endpoint_exists(self, client: AsyncClient):
        """POST /api/v1/auth/register — endpoint существует."""
        response = await client.post(
            "/api/v1/auth/register",
            json={"email": "new@test.com", "password": "password123"}
        )
        # 201 (успех) или 400 (дубликат) — главное не 500
        assert response.status_code in [201, 400]
        assert response.status_code != 500

    @pytest.mark.asyncio
    async def test_register_short_password_returns_422(self, client: AsyncClient):
        """POST /api/v1/auth/register — короткий пароль → 422."""
        response = await client.post(
            "/api/v1/auth/register",
            json={"email": "short@test.com", "password": "123"}
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_invalid_email_returns_422(self, client: AsyncClient):
        """POST /api/v1/auth/register — невалидный email → 422."""
        response = await client.post(
            "/api/v1/auth/register",
            json={"email": "not-an-email", "password": "password123"}
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_missing_fields_returns_422(self, client: AsyncClient):
        """POST /api/v1/auth/register — отсутствие полей → 422."""
        response = await client.post(
            "/api/v1/auth/register",
            json={}
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_login_endpoint_exists(self, client: AsyncClient):
        """POST /api/v1/auth/login — endpoint существует."""
        response = await client.post(
            "/api/v1/auth/login",
            data={"username": "test@test.com", "password": "password123"}
        )
        # 200 (успех) или 401 (неверный пароль) — главное не 500
        assert response.status_code in [200, 401]
        assert response.status_code != 500

    @pytest.mark.asyncio
    async def test_login_wrong_credentials_returns_401(self, client: AsyncClient):
        """POST /api/v1/auth/login — неверные данные → 401."""
        response = await client.post(
            "/api/v1/auth/login",
            data={"username": "nonexistent@test.com", "password": "wrongpass"}
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_me_with_resident(self, resident_client: AsyncClient):
        """GET /api/v1/auth/me — авторизованный resident видит профиль."""
        response = await resident_client.get("/api/v1/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "role" in data
        assert data["role"] == "resident"

    @pytest.mark.asyncio
    async def test_get_me_without_token_returns_401(self, client: AsyncClient):
        """GET /api/v1/auth/me — без токена → 401."""
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_me_with_invalid_token_returns_401(self, client: AsyncClient):
        """GET /api/v1/auth/me — с невалидным токеном → 401."""
        headers = {"Authorization": "Bearer invalid_token_here"}
        response = await client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 401

class TestProfile:
    """Smoke-тесты профиля и настроек пользователя."""

    @pytest.mark.asyncio
    async def test_get_me_has_profile_fields(self, resident_client: AsyncClient):
        """GET /api/v1/auth/me — отдаёт поля профиля и уведомлений."""
        response = await resident_client.get("/api/v1/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "full_name" in data
        assert "notify_new_surveys" in data
        assert "notify_results" in data
        assert "notify_pollution" in data

    @pytest.mark.asyncio
    async def test_patch_me_requires_auth(self, client: AsyncClient):
        """PATCH /api/v1/auth/me — без токена → 401."""
        response = await client.patch("/api/v1/auth/me", json={"full_name": "Иван"})
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_patch_me_updates_profile(self, resident_client: AsyncClient):
        """PATCH /api/v1/auth/me — resident обновляет имя."""
        from types import SimpleNamespace
        with patch("app.routers.auth.UserService") as MockService:
            instance = MockService.return_value
            instance.update_profile = AsyncMock(return_value=SimpleNamespace(
                id=1, email="test@test.com", role="resident", is_active=True,
                full_name="Иван", created_at=None,
                notify_new_surveys=True, notify_results=True, notify_pollution=False,
            ))
            response = await resident_client.patch(
                "/api/v1/auth/me", json={"full_name": "Иван"},
            )
            assert response.status_code == 200
            assert response.json()["full_name"] == "Иван"

    @pytest.mark.asyncio
    async def test_change_password_requires_auth(self, client: AsyncClient):
        """POST /api/v1/auth/me/password — без токена → 401."""
        response = await client.post(
            "/api/v1/auth/me/password",
            json={"old_password": "oldpass1", "new_password": "newpass1"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_change_password_short_new_returns_422(self, resident_client: AsyncClient):
        """POST /api/v1/auth/me/password — короткий новый пароль → 422."""
        response = await resident_client.post(
            "/api/v1/auth/me/password",
            json={"old_password": "oldpass1", "new_password": "123"},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_change_password_success(self, resident_client: AsyncClient):
        """POST /api/v1/auth/me/password — успешная смена."""
        with patch("app.routers.auth.UserService") as MockService:
            instance = MockService.return_value
            instance.change_password = AsyncMock(return_value=None)
            response = await resident_client.post(
                "/api/v1/auth/me/password",
                json={"old_password": "oldpass1", "new_password": "newpass1"},
            )
            assert response.status_code == 200

# ─────────────────────────────────────────────────────────────────────────────
# 3. SENSORS (IoT)
# ─────────────────────────────────────────────────────────────────────────────

class TestSensors:
    """Smoke-тесты модуля IoT-датчиков."""

    @pytest.mark.asyncio
    async def test_get_all_sensors(self, client: AsyncClient):
        """GET /api/v1/sensors — endpoint доступен, возвращает список."""
        with patch("app.routers.sensors.SensorService") as MockService:
            instance = MockService.return_value
            instance.list_active = AsyncMock(return_value=[])

            response = await client.get("/api/v1/sensors")
            assert response.status_code == 200
            assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_get_sensor_history(self, client: AsyncClient):
        """GET /api/v1/sensors/{id}/history — endpoint доступен."""
        with patch("app.routers.sensors.SensorService") as MockService:
            instance = MockService.return_value
            mock_sensors = MagicMock()
            mock_sensors.get_history = AsyncMock(return_value=[])
            instance.sensors = mock_sensors

            response = await client.get("/api/v1/sensors/1/history")
            assert response.status_code == 200
            assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_iot_measurement_endpoint(self, client: AsyncClient):
        """POST /api/v1/sensors/iot/measurements — IoT-шлюз принимает данные."""
        with patch("app.routers.sensors.SensorService") as MockService, \
             patch("app.tasks.incident_detector.run_incident_detection") as mock_detect:
            instance = MockService.return_value
            instance.ingest_measurement = AsyncMock(return_value=1)

            response = await client.post(
                "/api/v1/sensors/iot/measurements",
                json={
                    "sensor_id": 1,
                    "value": 42.5,
                    "metric_name": "PM2.5",
                    "quality_status": "VALID"
                }
            )
            assert response.status_code == 201
            data = response.json()
            assert data["status"] == "accepted"
            assert "measurement_id" in data

    @pytest.mark.asyncio
    async def test_iot_measurement_invalid_data_returns_422(self, client: AsyncClient):
        """POST /api/v1/sensors/iot/measurements — невалидные данные → 422."""
        response = await client.post(
            "/api/v1/sensors/iot/measurements",
            json={"sensor_id": "not_a_number"}
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_sensor_requires_admin(self, admin_client: AsyncClient):
        """POST /api/v1/sensors — admin может создать датчик."""
        from types import SimpleNamespace
        with patch("app.routers.sensors.SensorService") as MockService:
            instance = MockService.return_value
            # SimpleNamespace вместо MagicMock — Pydantic может сериализовать
            mock_sensor = SimpleNamespace(
                id=1, name="Test Sensor", sensor_type="air", status="ACTIVE",
                lat=55.75, lon=37.61, district_id=1
            )
            instance.create_sensor = AsyncMock(return_value=mock_sensor)

            response = await admin_client.post(
                "/api/v1/sensors",
                json={
                    "name": "Test Sensor",
                    "sensor_type": "air",
                    "location": [55.75, 37.61]
                }
            )
            assert response.status_code == 201

    @pytest.mark.asyncio
    async def test_create_sensor_resident_forbidden(self, resident_client: AsyncClient):
        """POST /api/v1/sensors — resident не может создать датчик → 403."""
        response = await resident_client.post(
            "/api/v1/sensors",
            json={
                "name": "Test Sensor",
                "sensor_type": "air",
                "location": [55.75, 37.61]
            }
        )
        assert response.status_code == 403


# ─────────────────────────────────────────────────────────────────────────────
# 4. REPORTS (Жалобы жителей)
# ─────────────────────────────────────────────────────────────────────────────

class TestReports:
    """Smoke-тесты модуля жалоб."""

    @pytest.mark.asyncio
    async def test_get_all_reports(self, client: AsyncClient):
        """GET /api/v1/feedback/reports — публичный endpoint."""
        with patch("app.routers.reports.ReportService") as MockService:
            instance = MockService.return_value
            instance.list_reports = AsyncMock(return_value=[])

            response = await client.get("/api/v1/feedback/reports")
            assert response.status_code == 200
            assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_get_reports_with_district_filter(self, client: AsyncClient):
        """GET /api/v1/feedback/reports?district_id=1 — фильтр по району."""
        with patch("app.routers.reports.ReportService") as MockService:
            instance = MockService.return_value
            instance.list_reports = AsyncMock(return_value=[])

            response = await client.get("/api/v1/feedback/reports?district_id=1")
            assert response.status_code == 200
            assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_create_report_requires_auth(self, client: AsyncClient):
        """POST /api/v1/feedback/reports — без токена → 401."""
        response = await client.post(
            "/api/v1/feedback/reports",
            json={
                "category": "Загрязнение воздуха",
                "description": "Сильный запах гари в районе",
                "location": [55.7558, 37.6173]
            }
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_report_with_auth(self, resident_client: AsyncClient):
        """POST /api/v1/feedback/reports — resident создаёт жалобу."""
        with patch("app.routers.reports.ReportService") as MockService:
            instance = MockService.return_value
            mock_report = MagicMock()
            mock_report.id = 1
            mock_report.user_id = 1
            mock_report.district_id = 1
            mock_report.category = "Загрязнение воздуха"
            mock_report.description = "Сильный запах гари в районе парка"
            mock_report.status = "NEW"
            mock_report.created_at = "2026-10-08T12:00:00"
            mock_report.lat = 55.7558
            mock_report.lon = 37.6173
            mock_report.attachments = []
            instance.create_report = AsyncMock(return_value=mock_report)

            response = await resident_client.post(
                "/api/v1/feedback/reports",
                json={
                    "category": "Загрязнение воздуха",
                    "description": "Сильный запах гари в районе парка",
                    "location": [55.7558, 37.6173]
                }
            )
            assert response.status_code == 201
            data = response.json()
            assert data["category"] == "Загрязнение воздуха"

    @pytest.mark.asyncio
    async def test_create_report_invalid_coordinates(self, resident_client: AsyncClient):
        """POST /api/v1/feedback/reports — невалидные координаты → 422."""
        response = await resident_client.post(
            "/api/v1/feedback/reports",
            json={
                "category": "Загрязнение",
                "description": "Тестовая жалоба с невалидными координатами",
                "location": [999.0, 999.0]
            }
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_report_short_description(self, resident_client: AsyncClient):
        """POST /api/v1/feedback/reports — короткое описание → 422."""
        response = await resident_client.post(
            "/api/v1/feedback/reports",
            json={
                "category": "Загрязнение",
                "description": "Hi",
                "location": [55.7558, 37.6173]
            }
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_get_my_reports_requires_auth(self, client: AsyncClient):
        """GET /api/v1/feedback/reports/my — без токена → 401."""
        response = await client.get("/api/v1/feedback/reports/my")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_my_reports_with_auth(self, resident_client: AsyncClient):
        """GET /api/v1/feedback/reports/my — resident видит свои жалобы."""
        with patch("app.routers.reports.ReportService") as MockService:
            instance = MockService.return_value
            instance.list_my_reports = AsyncMock(return_value=[])

            response = await resident_client.get("/api/v1/feedback/reports/my")
            assert response.status_code == 200
            assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_delete_report_requires_auth(self, client: AsyncClient):
        """DELETE /api/v1/feedback/reports/{id} — без токена → 401."""
        response = await client.delete("/api/v1/feedback/reports/1")
        assert response.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# 5. SURVEYS (Опросы)
# ─────────────────────────────────────────────────────────────────────────────

class TestSurveys:
    """Smoke-тесты модуля опросов."""

    @pytest.mark.asyncio
    async def test_get_active_surveys(self, client: AsyncClient):
        """GET /api/v1/feedback/surveys — публичный endpoint."""
        with patch("app.routers.surveys.SurveyService") as MockService:
            instance = MockService.return_value
            instance.list_active = AsyncMock(return_value=[])

            response = await client.get("/api/v1/feedback/surveys")
            assert response.status_code == 200
            assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_create_survey_requires_author_role(self, resident_client: AsyncClient):
        """POST /api/v1/feedback/surveys — resident не может создать опрос → 403."""
        response = await resident_client.post(
            "/api/v1/feedback/surveys",
            json={"title": "Тестовый опрос", "questions": []}
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_create_survey_with_author(self, author_client: AsyncClient):
        """POST /api/v1/feedback/surveys — author может создать опрос."""
        from types import SimpleNamespace
        from datetime import datetime, timezone
        with patch("app.routers.surveys.SurveyService") as MockService:
            instance = MockService.return_value
            mock_question = SimpleNamespace(
                id=1, survey_id=1, text="Как дела?",
                question_type="text", options=[]
            )
            mock_survey = SimpleNamespace(
                id=1, title="Тестовый опрос", description=None,
                is_active=True, created_at=datetime.now(timezone.utc),
                questions=[mock_question]
            )
            instance.create_survey = AsyncMock(return_value=mock_survey)

            # SurveyCreate требует min_length=1 для questions
            response = await author_client.post(
                "/api/v1/feedback/surveys",
                json={
                    "title": "Тестовый опрос",
                    "questions": [
                        {
                            "text": "Как вы оцениваете качество воздуха?",
                            "question_type": "text"
                        }
                    ]
                }
            )
            assert response.status_code == 201

    @pytest.mark.asyncio
    async def test_submit_answers_requires_auth(self, client: AsyncClient):
        """POST /api/v1/feedback/surveys/{id}/answers — без токена → 401."""
        response = await client.post(
            "/api/v1/feedback/surveys/1/answers",
            json={"answers": []}
        )
        assert response.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# 6. INCIDENTS (Инциденты)
# ─────────────────────────────────────────────────────────────────────────────

class TestIncidents:
    """Smoke-тесты модуля инцидентов."""

    @pytest.mark.asyncio
    async def test_get_incidents_requires_auth(self, client: AsyncClient):
        """GET /api/v1/incidents — без токена → 401."""
        response = await client.get("/api/v1/incidents")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_incidents_with_auth(self, resident_client: AsyncClient):
        """GET /api/v1/incidents — авторизованный видит список."""
        with patch("app.routers.incidents.IncidentService") as MockService:
            instance = MockService.return_value
            instance.list_all = AsyncMock(return_value=[])

            response = await resident_client.get("/api/v1/incidents")
            assert response.status_code == 200
            assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_get_incidents_with_status_filter(self, resident_client: AsyncClient):
        """GET /api/v1/incidents?status_filter=ACTIVE — фильтр работает."""
        with patch("app.routers.incidents.IncidentService") as MockService:
            instance = MockService.return_value
            instance.list_all = AsyncMock(return_value=[])

            response = await resident_client.get(
                "/api/v1/incidents?status_filter=ACTIVE"
            )
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_create_incident_requires_admin(self, resident_client: AsyncClient):
        """POST /api/v1/incidents — resident не может создать → 403."""
        response = await resident_client.post(
            "/api/v1/incidents?district_id=1&title=Тест"
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_create_incident_with_admin(self, admin_client: AsyncClient):
        """POST /api/v1/incidents — admin может создать инцидент."""
        from types import SimpleNamespace
        from datetime import datetime, timezone
        with patch("app.routers.incidents.IncidentService") as MockService:
            instance = MockService.return_value
            # SimpleNamespace с явными значениями для Pydantic
            mock_incident = SimpleNamespace(
                id=1, district_id=1, title="Тестовый инцидент",
                status="ACTIVE", confidence_rate=0.95,
                operator_comment=None,
                created_at=datetime.now(timezone.utc),
                resolved_at=None,
                reports=[], sensors=[]
            )
            instance.create_manual = AsyncMock(return_value=mock_incident)

            response = await admin_client.post(
                "/api/v1/incidents?district_id=1&title=Тестовый инцидент"
            )
            assert response.status_code == 201

    @pytest.mark.asyncio
    async def test_delete_incident_requires_admin(self, resident_client: AsyncClient):
        """DELETE /api/v1/incidents/{id} — resident не может удалить → 403."""
        response = await resident_client.delete("/api/v1/incidents/1")
        assert response.status_code == 403


# ─────────────────────────────────────────────────────────────────────────────
# 7. MAPS / DISTRICTS
# ─────────────────────────────────────────────────────────────────────────────

class TestMapsDistricts:
    """Smoke-тесты модуля карт и районов."""

    @pytest.mark.asyncio
    async def test_get_districts_geojson(self, client: AsyncClient):
        """GET /api/v1/maps/districts — публичный endpoint."""
        with patch("app.routers.maps.DistrictService") as MockService:
            instance = MockService.return_value
            instance.list_all = AsyncMock(return_value=[])

            response = await client.get("/api/v1/maps/districts")
            assert response.status_code == 200
            assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_get_districts_short_list(self, client: AsyncClient):
        """GET /api/v1/maps/districts/list — короткий список."""
        with patch("app.routers.maps.DistrictService") as MockService:
            instance = MockService.return_value
            mock_districts = MagicMock()
            mock_districts.list_all_short = AsyncMock(return_value=[])
            instance.districts = mock_districts

            response = await client.get("/api/v1/maps/districts/list")
            assert response.status_code == 200
            assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_get_district_stats(self, client: AsyncClient):
        """GET /api/v1/maps/districts/{id}/stats — ECI статистика."""
        with patch("app.routers.maps.DistrictService") as MockService:
            instance = MockService.return_value
            instance.get_eci_stats = AsyncMock(return_value=MagicMock(
                air_score=0.8, water_score=0.7, citizen_score=0.6,
                trend_score=0.9, eci=0.75
            ))

            response = await client.get("/api/v1/maps/districts/1/stats")
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_create_district_requires_admin(self, resident_client: AsyncClient):
        """POST /api/v1/maps/districts — resident не может создать → 403."""
        response = await resident_client.post(
            "/api/v1/maps/districts",
            json={
                "name": "Тестовый район",
                "polygon": [[[37.6, 55.7], [37.7, 55.7], [37.7, 55.8], [37.6, 55.8], [37.6, 55.7]]],
                "city_id": 1,
                "color_hex": "#FF0000"
            }
        )
        assert response.status_code == 403


# ─────────────────────────────────────────────────────────────────────────────
# 8. ANALYTICS
# ─────────────────────────────────────────────────────────────────────────────

class TestAnalytics:
    """Smoke-тесты модуля аналитики."""

    @pytest.mark.asyncio
    async def test_dashboard_requires_auth(self, client: AsyncClient):
        """GET /api/v1/analytics/dashboard — без токена → 401."""
        response = await client.get("/api/v1/analytics/dashboard")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_dashboard_requires_author_or_admin(self, resident_client: AsyncClient):
        """GET /api/v1/analytics/dashboard — resident → 403."""
        response = await resident_client.get("/api/v1/analytics/dashboard")
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_dashboard_accessible_for_admin(self, admin_client: AsyncClient):
        """GET /api/v1/analytics/dashboard — admin имеет доступ."""
        with patch("app.routers.analytics.AnalyticsService") as MockService:
            instance = MockService.return_value
            instance.get_dashboard_metrics = AsyncMock(return_value={
                "total_sensors": 11,
                "total_reports": 50,
                "active_incidents": 2
            })

            response = await admin_client.get("/api/v1/analytics/dashboard")
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_dashboard_accessible_for_author(self, author_client: AsyncClient):
        """GET /api/v1/analytics/dashboard — author тоже имеет доступ."""
        with patch("app.routers.analytics.AnalyticsService") as MockService:
            instance = MockService.return_value
            instance.get_dashboard_metrics = AsyncMock(return_value={})

            response = await author_client.get("/api/v1/analytics/dashboard")
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_correlations_requires_auth(self, client: AsyncClient):
        """GET /api/v1/analytics/correlations — без токена → 401."""
        response = await client.get("/api/v1/analytics/correlations")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_correlations_forbidden_for_resident(self, resident_client: AsyncClient):
        """GET /api/v1/analytics/correlations — resident → 403."""
        response = await resident_client.get("/api/v1/analytics/correlations")
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_recalculate_requires_admin(self, resident_client: AsyncClient):
        """POST /api/v1/analytics/recalculate — resident → 403."""
        response = await resident_client.post("/api/v1/analytics/recalculate")
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_recalculate_with_admin(self, admin_client: AsyncClient):
        """POST /api/v1/analytics/recalculate — admin может пересчитать."""
        with patch("app.routers.analytics.AnalyticsService") as MockService:
            instance = MockService.return_value
            instance.recalculate_eci = AsyncMock(return_value={"status": "ok"})

            response = await admin_client.post("/api/v1/analytics/recalculate")
            assert response.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# 9. CORS & SECURITY
# ─────────────────────────────────────────────────────────────────────────────

class TestSecurityHeaders:
    """Smoke-тесты безопасности."""

    @pytest.mark.asyncio
    async def test_no_server_errors_on_malformed_json(self, client: AsyncClient):
        """POST с невалидным JSON не должен вызывать 500."""
        response = await client.post(
            "/api/v1/auth/register",
            content=b"not valid json{{{",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_no_server_errors_on_empty_body(self, client: AsyncClient):
        """POST с пустым телом не должен вызывать 500."""
        response = await client.post(
            "/api/v1/feedback/reports",
            content=b"",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code != 500

    @pytest.mark.asyncio
    async def test_content_type_validation(self, client: AsyncClient):
        """POST без Content-Type не должен крашить сервер."""
        response = await client.post(
            "/api/v1/auth/register",
            content="email=test@test.com&password=123456"
        )
        assert response.status_code != 500


# ─────────────────────────────────────────────────────────────────────────────
# 10. EDGE CASES
# ─────────────────────────────────────────────────────────────────────────────

class TestEdgeCases:
    """Тесты граничных случаев."""

    @pytest.mark.asyncio
    async def test_nonexistent_endpoint_returns_404(self, client: AsyncClient):
        """GET /api/v1/nonexistent — 404, не 500."""
        response = await client.get("/api/v1/nonexistent")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_empty_body_post_returns_422(self, client: AsyncClient):
        """POST без тела на endpoint с required body — 422."""
        response = await client.post("/api/v1/auth/register")
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_invalid_method_returns_405(self, client: AsyncClient):
        """PUT на endpoint который не поддерживает PUT — 405."""
        response = await client.put("/api/v1/auth/login")
        assert response.status_code == 405

    @pytest.mark.asyncio
    async def test_very_long_string_doesnt_crash(self, resident_client: AsyncClient):
        """Очень длинная строка не крашит сервер."""
        long_description = "A" * 5000

        response = await resident_client.post(
            "/api/v1/feedback/reports",
            json={
                "category": "Тест",
                "description": long_description,
                "location": [55.7558, 37.6173]
            }
        )
        # 422 (валидация max_length) или 201 — главное не 500
        assert response.status_code in [422, 201]
        assert response.status_code != 500

    @pytest.mark.asyncio
    async def test_special_characters_in_json(self, resident_client: AsyncClient):
        """Спецсимволы и XSS-попытки в JSON не крашат сервер."""
        from types import SimpleNamespace
        from datetime import datetime, timezone
        with patch("app.routers.reports.ReportService") as MockService:
            instance = MockService.return_value
            mock_report = SimpleNamespace(
                id=1, user_id=1, district_id=1,
                category="Загрязнение",
                description="Тест с спецсимволами",
                status="NEW", created_at=datetime.now(timezone.utc),
                lat=55.7558, lon=37.6173, attachments=[]
            )
            instance.create_report = AsyncMock(return_value=mock_report)

            response = await resident_client.post(
                "/api/v1/feedback/reports",
                json={
                    "category": "Загрязнение",
                    "description": "Тест с спецсимволами: <script>alert(1)</script> & accents",
                    "location": [55.7558, 37.6173]
                }
            )
            assert response.status_code != 500

    @pytest.mark.asyncio
    async def test_negative_sensor_id(self, client: AsyncClient):
        """GET /api/v1/sensors/-1/history — отрицательный ID не крашит."""
        with patch("app.routers.sensors.SensorService") as MockService:
            instance = MockService.return_value
            mock_sensors = MagicMock()
            mock_sensors.get_history = AsyncMock(return_value=[])
            instance.sensors = mock_sensors

            response = await client.get("/api/v1/sensors/-1/history")
            assert response.status_code != 500

    @pytest.mark.asyncio
    async def test_zero_id_doesnt_crash(self, client: AsyncClient):
        """GET /api/v1/sensors/0/history — нулевой ID не крашит."""
        with patch("app.routers.sensors.SensorService") as MockService:
            instance = MockService.return_value
            mock_sensors = MagicMock()
            mock_sensors.get_history = AsyncMock(return_value=[])
            instance.sensors = mock_sensors

            response = await client.get("/api/v1/sensors/0/history")
            assert response.status_code != 500


# ─────────────────────────────────────────────────────────────────────────────
# 11. INTEGRATION SCENARIOS (End-to-End Smoke)
# ─────────────────────────────────────────────────────────────────────────────

class TestIntegrationScenarios:
    """Сквозные smoke-сценарии."""

    @pytest.mark.asyncio
    async def test_all_public_endpoints_accessible(self, client: AsyncClient):
        """Все публичные endpoints отвечают без ошибок."""
        with patch("app.routers.sensors.SensorService") as MockSensor, \
             patch("app.routers.reports.ReportService") as MockReport, \
             patch("app.routers.surveys.SurveyService") as MockSurvey, \
             patch("app.routers.maps.DistrictService") as MockDistrict:

            MockSensor.return_value.list_active = AsyncMock(return_value=[])
            MockReport.return_value.list_reports = AsyncMock(return_value=[])
            MockSurvey.return_value.list_active = AsyncMock(return_value=[])
            MockDistrict.return_value.list_all = AsyncMock(return_value=[])
            mock_d = MagicMock()
            mock_d.list_all_short = AsyncMock(return_value=[])
            MockDistrict.return_value.districts = mock_d

            public_endpoints = [
                "/",
                "/api/v1/sensors",
                "/api/v1/feedback/reports",
                "/api/v1/feedback/surveys",
                "/api/v1/maps/districts",
                "/api/v1/maps/districts/list",
            ]

            for endpoint in public_endpoints:
                response = await client.get(endpoint)
                assert response.status_code == 200, \
                    f"Endpoint {endpoint} вернул {response.status_code}: {response.text}"

    @pytest.mark.asyncio
    async def test_auth_protected_endpoints_return_401(self, client: AsyncClient):
        """Все защищённые endpoints без токена → 401."""
        protected_endpoints = [
            "/api/v1/auth/me",
            "/api/v1/incidents",
            "/api/v1/analytics/dashboard",
            "/api/v1/analytics/correlations",
            "/api/v1/feedback/reports/my",
        ]

        for endpoint in protected_endpoints:
            response = await client.get(endpoint)
            assert response.status_code == 401, \
                f"Endpoint {endpoint} без токена вернул {response.status_code}"

    @pytest.mark.asyncio
    async def test_role_based_access_control(self, resident_client: AsyncClient):
        """RBAC: resident не имеет доступа к admin-only endpoints."""
        admin_only_endpoints = [
            ("GET", "/api/v1/analytics/dashboard"),
            ("GET", "/api/v1/analytics/correlations"),
        ]

        for method, endpoint in admin_only_endpoints:
            response = await resident_client.get(endpoint)
            assert response.status_code == 403, \
                f"Resident получил {response.status_code} на {endpoint}, ожидался 403"

    @pytest.mark.asyncio
    async def test_admin_can_access_all_analytics(self, admin_client: AsyncClient):
        """Admin имеет доступ ко всем analytics endpoints."""
        with patch("app.routers.analytics.AnalyticsService") as MockService:
            instance = MockService.return_value
            instance.get_dashboard_metrics = AsyncMock(return_value={})
            instance.get_correlations = AsyncMock(return_value={})
            instance.recalculate_eci = AsyncMock(return_value={})

            endpoints = [
                ("GET", "/api/v1/analytics/dashboard"),
                ("GET", "/api/v1/analytics/correlations"),
                ("POST", "/api/v1/analytics/recalculate"),
            ]

            for method, endpoint in endpoints:
                if method == "GET":
                    response = await admin_client.get(endpoint)
                else:
                    response = await admin_client.post(endpoint)
                assert response.status_code == 200, \
                    f"Admin не получил доступ к {endpoint}: {response.status_code}"


# ─────────────────────────────────────────────────────────────────────────────
# RUNNER
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
