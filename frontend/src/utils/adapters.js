// ── Маппинг ECI → цвет ──
function eciToColor(eci) {
  if (eci <= 25) return '#34d399';
  if (eci <= 50) return '#fbbf24';
  if (eci <= 75) return '#f97316';
  return '#ef4444';
}

// ── Единицы измерения ──
const UNIT_MAP = {
  pm25: 'мкг/м³',
  pm10: 'мкг/м³',
  no2: 'мкг/м³',
  so2: 'мкг/м³',
  co: 'мг/м³',
  temperature: '°C',
  humidity: '%',
  noise: 'дБ',
  ph: 'pH',
  turbidity: 'NTU',
};

// ── Человекочитаемые названия метрик ──
const METRIC_LABEL = {
  pm25: 'PM2.5',
  pm10: 'PM10',
  no2: 'NO₂',
  so2: 'SO₂',
  co: 'CO',
  temperature: 'Температура',
  humidity: 'Влажность',
  noise: 'Шум',
  ph: 'pH',
  turbidity: 'Мутность',
};

// ── Главная метрика для отображения в списке ──
function pickMainMetric(type, metrics) {
  if (!metrics) return null;
  const priority = type === 'water'
    ? ['ph', 'temperature', 'turbidity']
    : ['pm25', 'pm10', 'no2', 'so2', 'co'];
  for (const key of priority) {
    if (metrics[key] != null) {
      return { metric: key, value: metrics[key], unit: UNIT_MAP[key] ?? '' };
    }
  }
  return null;
}

// ── Фиктивная история для графика ──
function fakeHistory(eciScore) {
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'];
  return months.map((m, i) => ({
    month: m,
    aqi: Math.round(eciScore + Math.sin(i) * 5),
  }));
}

// ── GeoJSON [lon, lat] → Яндекс [lat, lon] ──
function polygonToYandex(polygonGeoJson) {
  if (!polygonGeoJson?.coordinates) return [];
  return polygonGeoJson.coordinates[0].map(([lon, lat]) => [lat, lon]);
}

// ── Точка в полигоне ──
function pointInPolygon(lat, lon, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lonI] = polygon[i];
    const [latJ, lonJ] = polygon[j];
    const intersect =
      (lonI > lon) !== (lonJ > lon) &&
      lat < ((latJ - latI) * (lon - lonI)) / (lonJ - lonI) + latI;
    if (intersect) inside = !inside;
  }
  return inside;
}

// ── Главный адаптер ──
export function buildDistricts(backendDistricts, backendSensors, histories = []) {
  const prepared = backendDistricts.map((d) => ({
    ...d,
    _polygon: polygonToYandex(d.polygon_geojson),
  }));

  // Карта: sensorId → { metric_name: value, ... }
  const metricsBySensor = {};
  backendSensors.forEach((sensor, idx) => {
    const history = histories[idx] ?? [];
    const map = {};
    for (const m of history) {
      map[m.metric_name] = m.value;
    }
    metricsBySensor[sensor.id] = map;
  });

  return prepared.map((d) => {
    const mySensors = backendSensors
      .filter((s) => pointInPolygon(s.location[0], s.location[1], d._polygon))
      .map((s) => {
        const metrics = metricsBySensor[s.id] ?? {};
        const main = pickMainMetric(s.sensor_type, metrics);

        return {
          id: s.id,
          type: s.sensor_type,
          name: s.name,
          value: main?.value ?? null,
          unit: main?.unit ?? '',
          metric: main?.metric ?? '',
          metricLabel: main ? METRIC_LABEL[main.metric] : '',
          allMetrics: metrics,
          coords: s.location,
          status: 'normal',
        };
      });

    return {
      id: d.id,
      name: d.name,
      pollutionLevel: d.eci_score,
      eci_score: d.eci_score,
      color_hex: eciToColor(d.eci_score),
      coordinates: d._polygon,
      history: fakeHistory(d.eci_score),
      sensors: mySensors,
    };
  });
}

// ── Жалобы ──
export function buildReports(backendReports) {
  const CATEGORY_MAP = {
    air: 'Воздух',
    water: 'Вода',
    waste: 'Отходы',
    noise: 'Шум',
    other: 'Другое',
  };

  return backendReports.map((r, i) => ({
    id: r.id,
    category: CATEGORY_MAP[r.category] ?? r.category,
    status: r.status,
    coords: [
      r.location[0] + 0.002 * Math.sin(i * 2),
      r.location[1] + 0.002 * Math.cos(i * 2),
    ],
    districtId: r.district_id,
    text: r.description,
  }));
}

export { UNIT_MAP, METRIC_LABEL };