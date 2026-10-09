# EcoCity — Платформа коллективного экологического мониторинга города

MVP-сервис для сбора обратной связи по экологической обстановке и управления инцидентами. Отображает районы города на Яндекс.Картах с цветовой индикацией по индексу ECI, показывает датчики и жалобы жителей, позволяет проходить опросы и обрабатывать инциденты операторам.

## 🚀 Что реализовано

### Карта города
- 3 района Калуги с полигонами и цветовой индикацией по ECI
- 10 IoT-датчиков (воздух / вода) с цветовой маркировкой по значению PM2.5 / pH
- Жалобы жителей с геопривязкой
- Всплывающие балуны с полным списком метрик
- Боковая панель района с графиком AQI и показаниями датчиков

### Аутентификация и роли
- JWT-авторизация (OAuth2 password flow)
- Регистрация новых жителей
- 4 роли: **guest** / **resident** / **author** / **admin**
- Защита маршрутов и UI в зависимости от роли

### Обратная связь
- Отправка жалоб с геопривязкой (клик по карте → модалка → POST на бэк)
- Категории: воздух / вода / отходы / шум / другое
- Автоматическое определение района через PostGIS `ST_Contains`
- Просмотр своих жалоб в профиле

### Опросы
- Список опросов с фильтрами (все / активные / завершённые)
- Прохождение опроса с типами вопросов: `single_choice`, `text`
- Сохранение ответов в БД
- Защита от повторного прохождения на клиенте (localStorage)

### Панель оператора
- Доступна только роли **admin**
- Список инцидентов с фильтрами по статусу
- Смена статуса: `IN_PROGRESS` / `RESOLVED` / `REJECTED`
- Комментарий оператора

### Профиль и настройки
- Профиль из `/auth/me` + список моих жалоб
- Переключение темы: светлая / тёмная / авто (системная)
- Сохранение выбора темы в localStorage

## 🛠️ Технологический стек

**Backend:**
- FastAPI
- SQLAlchemy 2.0 (Async)
- Alembic (миграции)
- asyncpg
- Pydantic v2
- PostgreSQL 15 + PostGIS 3.4 (GeoAlchemy2)
- JWT (python-jose, passlib)

**Frontend:**
- React 18
- Vite 5
- React Router 7
- Yandex Maps API 2.1 (`@pbe/react-yandex-maps`)
- lucide-react (иконки)
- recharts (графики)

**Инфраструктура:**
- Docker Compose (PostgreSQL + FastAPI)
- Демо-данные через `seed.py`

## 📂 Структура проекта

```
Hakaton/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy-модели (core, users, sensors, feedback, incidents, surveys)
│   │   ├── routers/         # HTTP-эндпоинты
│   │   ├── schemas/         # Pydantic-схемы
│   │   ├── services/        # Бизнес-логика (ECI, детектор)
│   │   ├── utils/           # Хеширование паролей, JWT
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   └── main.py
│   ├── alembic/             # Миграции БД
│   ├── scripts/
│   │   └── seed.py          # Демо-данные
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/             # Обёртки над fetch (client, auth, maps, feedback, surveys, incidents)
│   │   ├── components/      # UI-компоненты
│   │   ├── context/         # ThemeContext
│   │   ├── hooks/           # useAuth, useYandexMap
│   │   ├── pages/           # HomePage, SurveysPage, SurveyDetailPage, ProfilePage, SettingsPage, OperatorPage, LoginPage, RegisterPage
│   │   ├── utils/           # adapters, ecoHelpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 💻 Быстрый запуск

### 1. Поднять инфраструктуру (БД + бэкенд)

```bash
cd Hakaton
docker compose up -d --build
```

Это поднимет:
- **PostgreSQL 15** + **PostGIS 3.4** на порту `5432`
- **FastAPI** на порту `8000`

Проверь, что контейнеры живы:
```bash
docker ps
```

### 2. Применить миграции и заполнить демо-данными

```bash
# Миграции
docker exec -it ecocity-backend alembic upgrade head

# Демо-данные (3 района, 10 датчиков, 3 жалобы, 2 опроса, 2 инцидента)
docker exec -it ecocity-backend python scripts/seed.py
```

### 3. Пересчитать ECI

Открой http://localhost:8000/docs → **Authorize**:
- username: `admin@ecocity.local`
- password: `Admin123!`

Затем `POST /api/v1/analytics/recalculate` → **Try it out** → **Execute**.

### 4. Запустить фронтенд

```bash
cd frontend
npm install
npm run dev
```

Открой http://localhost:5173

## 🔑 Тестовые аккаунты

| Роль | Email | Пароль |
|---|---|---|
| Житель | `resident@ecocity.local` | `Resident123!` |
| Автор опросов | `author@ecocity.local` | `Author123!` |
| Администратор | `admin@ecocity.local` | `Admin123!` |

> ⚠️ Пароли предназначены **только для демонстрации**. В production их использовать нельзя.

## 🌐 Ключевые API-эндпоинты

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/v1/auth/register` | Регистрация жителя |
| POST | `/api/v1/auth/login` | Логин (OAuth2 form) |
| GET | `/api/v1/auth/me` | Текущий пользователь |
| GET | `/api/v1/maps/districts` | Районы с GeoJSON-полигонами |
| GET | `/api/v1/sensors` | Датчики |
| GET | `/api/v1/sensors/{id}/history` | История измерений датчика |
| POST | `/api/v1/feedback/reports` | Создать жалобу |
| GET | `/api/v1/feedback/reports/my` | Мои жалобы |
| GET | `/api/v1/feedback/surveys` | Список опросов |
| POST | `/api/v1/feedback/surveys/{id}/answers` | Отправить ответы |
| GET | `/api/v1/incidents` | Инциденты (только admin) |
| PATCH | `/api/v1/incidents/{id}/status` | Сменить статус инцидента |
| POST | `/api/v1/analytics/recalculate` | Пересчитать ECI |

Полная документация: http://localhost:8000/docs

## 🗺️ Формула ECI

Backend вычисляет индекс по формуле:

```
ECI = 0.40 × AirScore + 0.25 × WaterScore + 0.25 × CitizenScore + 0.10 × TrendScore
```

**Направление:** выше = лучше (100 — чистый район, 0 — грязный).

Цветовая шкала:
- `ECI >= 75` → 🟢 зелёный (хорошо)
- `ECI >= 50` → 🟡 жёлтый (средне)
- `ECI < 50`  → 🔴 красный (плохо)

## ⚠️ Ограничения MVP

- **Конструктор опросов** для авторов не реализован — опросы создаются через API / seed
- **Rule-based детектор инцидентов** не подключён — инциденты создаются в seed или вручную админом через `POST /api/v1/incidents`
- **Симулятор IoT-датчиков** отсутствует — измерения загружаются через seed
- **WebSocket-обновления** не реализованы
- **Защита от повторного прохождения опроса** работает только на клиенте (localStorage)
- **Смена пароля** через UI недоступна

## 📝 Лицензия

Проект создан в рамках хакатона. Демонстрационные данные и пароли не предназначены для production-использования.