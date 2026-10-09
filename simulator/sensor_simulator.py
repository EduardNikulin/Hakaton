# simulator/sensor_simulator.py
"""Симулятор IoT-датчиков: грузит датчики из API и шлёт замеры.

Запуск из папки simulator/:
  python sensor_simulator.py --mode normal --count 60
  python sensor_simulator.py --mode incident --sensor-id 5 --count 8
"""
import argparse
import random
import time

import requests

from config import (
    AIR_METRICS,
    API_BASE_URL,
    REQUEST_TIMEOUT_SECONDS,
    SEND_INTERVAL_SECONDS,
    WATER_METRICS,
)
from scenarios import SCENARIOS


def load_sensors(session: requests.Session) -> list[dict]:
    """Все датчики с координатами с карты."""
    r = session.get(f"{API_BASE_URL}/sensors", timeout=REQUEST_TIMEOUT_SECONDS)
    r.raise_for_status()
    return r.json()


def send_measurement(session, sensor_id: int, metric: str, value: float, quality: str) -> int:
    """Один замер в IoT-шлюз; возвращает HTTP-статус (201 = принят)."""
    r = session.post(
        f"{API_BASE_URL}/sensors/iot/measurements",
        json={
            "sensor_id": sensor_id,
            "metric_name": metric,
            "value": value,
            "quality_status": quality,
        },
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    return r.status_code


def metrics_for(sensor: dict) -> tuple:
    """Набор метрик по типу датчика: водяной отдаёт pH, остальные - воздух."""
    return WATER_METRICS if sensor.get("sensor_type") == "water" else AIR_METRICS


def main() -> None:
    parser = argparse.ArgumentParser(description="Симулятор IoT-датчиков")
    parser.add_argument("--mode", choices=sorted(SCENARIOS), default="normal",
                        help="сценарий значений замеров")
    parser.add_argument("--sensor-id", type=int, help="конкретный датчик (иначе случайный)")
    parser.add_argument("--count", type=int, default=60, help="число замеров")
    parser.add_argument("--interval", type=float, default=SEND_INTERVAL_SECONDS,
                        help="пауза между замерами, сек")
    args = parser.parse_args()

    scenario = SCENARIOS[args.mode]
    session = requests.Session()

    sensors = load_sensors(session)
    print(f"Загружено датчиков: {len(sensors)}")
    pool = [s for s in sensors if s["id"] == args.sensor_id] if args.sensor_id else sensors
    if not pool:
        raise SystemExit(f"Датчик с id={args.sensor_id} не найден")

    for i in range(args.count):
        sensor = random.choice(pool)
        metric = random.choice(metrics_for(sensor))
        value, quality = scenario(metric)
        status_code = send_measurement(session, sensor["id"], metric, value, quality)
        print(f"[{i + 1}/{args.count}] sensor={sensor['id']} {metric}={value} ({quality}) -> {status_code}")
        if i + 1 < args.count:
            time.sleep(args.interval)


if __name__ == "__main__":
    main()