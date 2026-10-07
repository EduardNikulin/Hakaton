// Районы города с координатами полигонов и датчиками
export const districts = [
  {
    id: 'central',
    name: 'Центральный район',
    pollutionLevel: 78, // 0–100 (AQI)
    // Координаты полигона (прямоугольник вокруг центра)
    coordinates: [
      [55.765, 37.595], [55.765, 37.645],
      [55.740, 37.645], [55.740, 37.595],
    ],
    sensors: [
      { id: 's1', type: 'air',   name: 'PM2.5',   value: 45,  unit: 'мкг/м³', status: 'warning' },
      { id: 's2', type: 'air',   name: 'CO₂',     value: 420, unit: 'ppm',    status: 'normal' },
      { id: 's3', type: 'water', name: 'pH воды', value: 6.8, unit: 'pH',     status: 'normal' },
    ],
    // История AQI за полгода
    history: [
      { month: 'Янв', aqi: 65 }, { month: 'Фев', aqi: 70 },
      { month: 'Мар', aqi: 72 }, { month: 'Апр', aqi: 68 },
      { month: 'Май', aqi: 75 }, { month: 'Июн', aqi: 78 },
    ],
  },
  {
    id: 'north',
    name: 'Северный район',
    pollutionLevel: 42,
    coordinates: [
      [55.810, 37.560], [55.810, 37.640],
      [55.770, 37.640], [55.770, 37.560],
    ],
    sensors: [
      { id: 's4', type: 'air',   name: 'PM2.5',   value: 18, unit: 'мкг/м³', status: 'good' },
      { id: 's5', type: 'air',   name: 'NO₂',     value: 30, unit: 'мкг/м³', status: 'normal' },
      { id: 's6', type: 'water', name: 'Кислород', value: 8.2, unit: 'мг/л', status: 'good' },
    ],
    history: [
      { month: 'Янв', aqi: 38 }, { month: 'Фев', aqi: 40 },
      { month: 'Мар', aqi: 35 }, { month: 'Апр', aqi: 42 },
      { month: 'Май', aqi: 44 }, { month: 'Июн', aqi: 42 },
    ],
  },
  {
    id: 'south',
    name: 'Южный район',
    pollutionLevel: 91,
    coordinates: [
      [55.735, 37.590], [55.735, 37.650],
      [55.700, 37.650], [55.700, 37.590],
    ],
    sensors: [
      { id: 's7', type: 'air',   name: 'PM2.5',   value: 82, unit: 'мкг/м³', status: 'danger' },
      { id: 's8', type: 'air',   name: 'SO₂',     value: 55, unit: 'мкг/м³', status: 'danger' },
      { id: 's9', type: 'water', name: 'pH воды', value: 5.2, unit: 'pH',    status: 'danger' },
    ],
    history: [
      { month: 'Янв', aqi: 85 }, { month: 'Фев', aqi: 88 },
      { month: 'Мар', aqi: 90 }, { month: 'Апр', aqi: 87 },
      { month: 'Май', aqi: 89 }, { month: 'Июн', aqi: 91 },
    ],
  },
  {
    id: 'west',
    name: 'Западный район',
    pollutionLevel: 25,
    coordinates: [
      [55.770, 37.510], [55.770, 37.590],
      [55.740, 37.590], [55.740, 37.510],
    ],
    sensors: [
      { id: 's12', type: 'air',   name: 'PM2.5',   value: 8,   unit: 'мкг/м³', status: 'good' },
      { id: 's13', type: 'water', name: 'pH воды', value: 7.2, unit: 'pH',     status: 'good' },
    ],
    history: [
      { month: 'Янв', aqi: 22 }, { month: 'Фев', aqi: 24 },
      { month: 'Мар', aqi: 20 }, { month: 'Апр', aqi: 25 },
      { month: 'Май', aqi: 23 }, { month: 'Июн', aqi: 25 },
    ],
  },
];

// Активные опросы (пока просто счётчик)
export const activeSurveysCount = 2;

// ─────────────────────────────────────────────
// Жалобы жителей (для отображения на карте)
// ─────────────────────────────────────────────
export const reports = [
  { id: 'r1', category: 'Запах', status: 'NEW',         coords: [55.755, 37.615], districtId: 'central' },
  { id: 'r2', category: 'Мусор', status: 'IN_PROGRESS', coords: [55.720, 37.610], districtId: 'south'   },
  { id: 'r3', category: 'Сливы', status: 'RESOLVED',    coords: [55.785, 37.600], districtId: 'north'   },
  { id: 'r4', category: 'Запах', status: 'NEW',         coords: [55.762, 37.632], districtId: 'central' },
  { id: 'r5', category: 'Шум',   status: 'NEW',         coords: [55.740, 37.580], districtId: 'west'    },
];

// ─────────────────────────────────────────────
// Инциденты (автосгенерированные детектором)
// ─────────────────────────────────────────────
export const incidents = [
  {
    id: 'i1',
    severity: 'CRITICAL',
    districtId: 'south',
    title: 'Аномалия PM2.5',
    sensorId: 's7',
    reportIds: ['r2'],
    createdAt: '2026-10-07T18:00:00',
  },
];