# Docker

Инструкция по запуску PostgreSQL + PostGIS через Docker Compose.

## Требования

Для работы с проектом нужен:

* Docker Desktop
* Git
* WSL 2 (для Windows рекомендуется Docker Desktop с backend WSL 2)

Отдельно устанавливать PostgreSQL или PostGIS в Windows/WSL не нужно.

## 1. Получить актуальный проект

```bash
git switch dev
git pull origin dev
```


## 2. Создать `.env`

В корне проекта находится `.env.example`.

Создать локальный `.env`:

```bash
cp .env.example .env
```

Файл `.env` не нужно добавлять в Git — он содержит локальные настройки.

По умолчанию используются:

```env
POSTGRES_DB=ecocity
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
```

## 3. Запустить PostgreSQL + PostGIS

Из корня проекта:

```bash
docker compose up -d
```

Проверить состояние:

```bash
docker compose ps
```

Должен быть запущен контейнер:

```text
ecocity-db
```

Посмотреть логи:

```bash
docker compose logs -f db
```

Для выхода из просмотра логов нажать `Ctrl+C`.

## 4. Подключение Backend к базе

Backend использует PostgreSQL через:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ecocity
```

Локальный файл:

```text
backend/.env
```

не добавляется в Git.

Если `backend/.env` отсутствует, его нужно создать и указать необходимые настройки приложения.

## 5. Применить миграции

После запуска базы:

```bash
cd backend
alembic upgrade head
```

Проверить текущую миграцию:

```bash
alembic current
```

Ожидается актуальная версия миграции.

## 6. Остановить базу

Из корня проекта:

```bash
docker compose down
```

Данные PostgreSQL сохраняются в Docker volume, поэтому обычный `down` базу данных не удаляет.

Запустить снова:

```bash
docker compose up -d
```

## 7. Полностью удалить базу

⚠️ Использовать только если нужно начать с чистой базы.

```bash
docker compose down -v
```

Команда удалит Docker volume с данными PostgreSQL.

После этого база создастся заново при:

```bash
docker compose up -d
```

и миграции нужно будет применить снова:

```bash
cd backend
alembic upgrade head
```

## Полезные команды

### Запустить

```bash
docker compose up -d
```

### Проверить контейнеры

```bash
docker compose ps
```

### Посмотреть логи

```bash
docker compose logs -f db
```

### Остановить

```bash
docker compose down
```

### Перезапустить

```bash
docker compose restart db
```

### Посмотреть Docker volumes

```bash
docker volume ls
```

## Для Windows

На Windows достаточно установить Docker Desktop и запустить его.

После запуска Docker Desktop команды можно выполнять из:

* PowerShell
* Windows Terminal
* WSL

Например:

```bash
docker compose up -d
```

PostgreSQL будет доступен на:

```text
localhost:5432
```

---

## Важное правило для Git

Не коммитить локальные `.env`:

```text
.env
backend/.env
```

Для общих настроек используем `.env.example`.
