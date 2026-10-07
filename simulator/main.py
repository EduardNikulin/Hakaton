# simulator/main.py
"""Оркестратор демонстрации обнаружения экологического инцидента.

Запуск (из любого места, venv активирован):
    python simulator/main.py --mode incident   # полный сценарий
    python simulator/main.py --mode normal     # фоновая симуляция

Сценарий incident: поиск датчика -> проверка района -> 3 свежие жалобы ->
аномальные pm25 через sensor_simulator.py -> ожидание BackgroundTasks ->
проверка инцидента. Backend не требует изменений.
"""

import argparse
import os
import random
import subprocess
import sys
import time
import traceback
from pathlib import Path

import requests

# --- Конфигурация: переменные окружения с дефолтами ---
API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000/api/v1")
INCIDENT_REPORTS_REQUIRED = int(os.getenv("INCIDENT_REPORTS_REQUIRED", "3"))
INCIDENT_DETECTION_WAIT_SECONDS = float(
    os.getenv("INCIDENT_DETECTION_WAIT_SECONDS", "3")
)
INCIDENT_REPORT_RADIUS_METERS = int(os.getenv("INCIDENT_REPORT_RADIUS_METERS", "1000"))

# Demo-пользователь из seed.py (роль resident подходит: жалобы создаёт любой авторизованный)
DEMO_EMAIL = os.getenv("DEMO_EMAIL", "resident@ecocity.local")
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "Resident123!")

# Существующий симулятор запускаем subprocess-ом (плоские импорты config/scenarios)
SIMULATOR_SCRIPT = Path(__file__).resolve().parent / "sensor_simulator.py"

MEASUREMENTS_COUNT = 6  # аномальных показаний pm25 (90-140 > порог 55)
MEASUREMENTS_INTERVAL = 0.2
POLL_INTERVAL_SECONDS = 0.5
REQUEST_TIMEOUT = 10

# Смещение жалоб от датчика: 0.003° широты ~ 333 м < INCIDENT_REPORT_RADIUS_METERS
REPORT_OFFSET_DEGREES = 0.003


def fail(message: str, code: int = 1) -> None:
    print(f"❌ {message}")
    sys.exit(code)


def ensure_backend(session: requests.Session) -> None:
    """Проверка доступности API до начала сценария."""
    try:
        session.get(f"{API_BASE_URL}/sensors", timeout=5)
    except requests.RequestException:
        host = API_BASE_URL.split("//", 1)[-1].split("/", 1)[0].split("/api")[0]
        print(f"❌ Backend is not available at http://{host}")
        print("Please start FastAPI first.")
        sys.exit(2)


def login(session: requests.Session) -> None:
    """OAuth2 form-data логин; токен кладём в заголовок сессии."""
    try:
        resp = session.post(
            f"{API_BASE_URL}/auth/login",
            data={"username": DEMO_EMAIL, "password": DEMO_PASSWORD},
            timeout=REQUEST_TIMEOUT,
        )
    except requests.RequestException as exc:
        fail(f"Backend is not available during login: {exc}", 2)
    if resp.status_code != 200:
        fail(
            f"Failed to login as demo user: HTTP {resp.status_code}. "
            f"Run backend/scripts/seed.py first."
        )
    session.headers["Authorization"] = f"Bearer {resp.json()['access_token']}"


def get_incidents(session: requests.Session) -> list[dict]:
    resp = session.get(f"{API_BASE_URL}/incidents", timeout=REQUEST_TIMEOUT)
    if resp.status_code != 200:
        fail(f"Failed to fetch incidents: HTTP {resp.status_code}")
    return resp.json()


def active_incident_districts(incidents: list[dict]) -> set[int]:
    """Районы, где есть инцидент со статусом, отличным от RESOLVED (правило дедупликации)."""
    return {i["district_id"] for i in incidents if i["status"] != "RESOLVED"}


def find_suitable_sensor(sensors: list[dict], blocked: set[int]) -> dict | None:
    """Датчик с district_id и координатами, в районе без незакрытого инцидента."""
    for sensor in sensors:
        if sensor.get("district_id") is None:
            continue
        loc = sensor.get("location")
        if not loc or len(loc) != 2:
            continue
        if sensor["district_id"] in blocked:
            continue
        return sensor
    return None


def create_reports(session: requests.Session, lat: float, lon: float) -> None:
    """Свежие жалобы практически в координатах датчика со случайным смещением."""
    print(f"[3/6] Creating reports (radius limit {INCIDENT_REPORT_RADIUS_METERS} m)...")
    for n in range(1, INCIDENT_REPORTS_REQUIRED + 1):
        payload = {
            "category": "air",
            "description": f"Демо-жалоба {n} из {INCIDENT_REPORTS_REQUIRED}: "
            f"резкий запах гари и смог рядом с датчиком.",
            "location": [
                lat + random.uniform(-REPORT_OFFSET_DEGREES, REPORT_OFFSET_DEGREES),
                lon + random.uniform(-REPORT_OFFSET_DEGREES, REPORT_OFFSET_DEGREES),
            ],
        }
        resp = session.post(
            f"{API_BASE_URL}/feedback/reports", json=payload, timeout=REQUEST_TIMEOUT
        )
        if resp.status_code != 201:
            fail(f"Failed to create report: HTTP {resp.status_code}")
        print(f"      Report {n}: OK")


def run_simulator(args: list[str]) -> None:
    """Запуск существующего sensor_simulator.py; вывод прозрачно печатаем,
    коды ответов проверяем на предмет не-2xx (иначе 500 выглядел бы успехом)."""
    result = subprocess.run(
        [sys.executable, str(SIMULATOR_SCRIPT), *args],
        cwd=SIMULATOR_SCRIPT.parent,
        capture_output=True,
        text=True,
    )
    for line in (result.stdout or "").splitlines():
        print(f"      {line}")
    if result.returncode != 0:
        last_err = (result.stderr or "").strip().splitlines()
        fail(
            f"Simulator exited with code {result.returncode}: "
            f"{last_err[-1] if last_err else 'no stderr'}"
        )
    for line in (result.stdout or "").splitlines():
        parts = line.rsplit("-> ", 1)
        if len(parts) == 2 and not parts[1].startswith("2"):
            fail(f"Failed to send sensor measurement: HTTP {parts[1]}")


def check_new_incident(
    session: requests.Session, district_id: int, min_id: int
) -> dict | None:
    """Ищем инцидент в нужном районе, созданный после начала теста (по id)."""
    for inc in get_incidents(session):
        if (
            inc["district_id"] == district_id
            and inc["id"] > min_id
            and inc["status"] != "RESOLVED"
        ):
            return inc
    return None


def wait_for_incident(
    session: requests.Session, district_id: int, min_id: int
) -> dict | None:
    """Polling каждые 0.5 сек до INCIDENT_DETECTION_WAIT_SECONDS, ранний выход при успехе."""
    deadline = time.monotonic() + INCIDENT_DETECTION_WAIT_SECONDS
    while True:
        inc = check_new_incident(session, district_id, min_id)
        if inc or time.monotonic() >= deadline:
            return inc
        time.sleep(POLL_INTERVAL_SECONDS)


def run_incident_demo(debug: bool) -> None:
    session = requests.Session()

    ensure_backend(session)
    login(session)

    print("[1/6] Searching for available sensor...")
    resp = session.get(f"{API_BASE_URL}/sensors", timeout=REQUEST_TIMEOUT)
    if resp.status_code != 200:
        fail(f"Failed to fetch sensors: HTTP {resp.status_code}")
    sensors = resp.json()
    if not sensors:
        fail("No suitable sensors found.")

    # [2/6] + повторная проверка перед жалобами: перебираем кандидатов,
    # пропуская районы с незакрытым инцидентом (правило дедупликации детектора)
    incidents = get_incidents(session)
    max_id_before = max((i["id"] for i in incidents), default=0)

    sensor = None
    blocked = active_incident_districts(incidents)
    while True:
        candidate = find_suitable_sensor(sensors, blocked)
        if candidate is None:
            print("No suitable sensor found.")
            print(
                "   Hint: all districts have open incidents - resolve them via "
                "PATCH /incidents/{id}/status (admin) and retry."
            )
            sys.exit(1)
        print(
            f"[2/6] Checking district {candidate['district_id']} "
            f"for active incidents..."
        )
        fresh = get_incidents(session)
        fresh_blocked = active_incident_districts(fresh)
        if candidate["district_id"] in fresh_blocked:
            print("      District already has an active incident.")
            blocked.add(candidate["district_id"])
            continue
        sensor = candidate
        break

    print(f"      Sensor: {sensor['name']}")
    print(f"      Sensor ID: {sensor['id']}")
    print(f"      District ID: {sensor['district_id']}")

    lat, lon = sensor["location"]
    create_reports(session, lat, lon)

    print(
        f"[4/6] Sending anomalous pm25 measurements "
        f"({MEASUREMENTS_COUNT} x, threshold 55)..."
    )
    run_simulator(
        [
            "--mode",
            "incident",
            "--sensor-id",
            str(sensor["id"]),
            "--count",
            str(MEASUREMENTS_COUNT),
            "--interval",
            str(MEASUREMENTS_INTERVAL),
        ]
    )

    print("[5/6] Waiting for incident detection...")
    incident = wait_for_incident(session, sensor["district_id"], max_id_before)

    print("[6/6] Checking incident...")
    if incident:
        print("      OK")
        print("=" * 40)
        print("🚨 INCIDENT CREATED")
        print("=" * 40)
        print(f"Sensor: {sensor['name']}")
        print(f"Sensor ID: {sensor['id']}")
        print(f"District: {sensor['district_id']}")
        print(f"Incident ID: {incident['id']}")
        print(f"Status: {incident['status']}")
        print(f"Confidence: {incident['confidence_rate']}%")
        print("=" * 40)
        sys.exit(0)

    print("=" * 40)
    print("❌ INCIDENT NOT CREATED")
    print("=" * 40)
    print("\nPossible reasons:")
    print("- less than 3 reports were created;")
    print("- reports are outside the " f"{INCIDENT_REPORT_RADIUS_METERS}m radius;")
    print("- sensor value was not detected as anomalous;")
    print("- district already has an active incident;")
    print("- background incident detection failed;")
    print("- backend is unavailable.")
    sys.exit(1)


def run_normal_demo(count: int) -> None:
    run_simulator(
        [
            "--mode",
            "normal",
            "--count",
            str(count),
            "--interval",
            str(MEASUREMENTS_INTERVAL),
        ]
    )
    print("Normal simulation completed. No incident expected.")


def main() -> None:
    parser = argparse.ArgumentParser(description="EcoCity demo orchestrator")
    parser.add_argument("--mode", choices=["incident", "normal"], default="incident")
    parser.add_argument(
        "--count", type=int, default=30, help="число замеров для normal-режима"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="показывать полный traceback при неожиданной ошибке",
    )
    args = parser.parse_args()

    try:
        if args.mode == "normal":
            run_normal_demo(args.count)
        else:
            run_incident_demo(args.debug)
    except SystemExit:
        raise
    except Exception as exc:  # неожиданные ошибки: кратко, traceback только в debug
        if args.debug:
            traceback.print_exc()
        fail(f"Unexpected error: {exc}")


if __name__ == "__main__":
    main()
