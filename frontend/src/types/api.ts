// DistrictSchema из backend/app/schemas/core.py
export interface District {
  id: number;
  city_id: number;
  name: string;
  polygon_geojson: GeoJSONPolygon;
  eci_score: number;
  color_hex: string;
}

// GeoJSON Polygon (координаты [lon, lat])
export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // rings → points → [lon, lat]
}

// SensorSchema из backend/app/schemas/sensors.py
export interface Sensor {
  id: number;
  district_id: number | null;
  name: string;
  sensor_type: 'air' | 'water';
  status: string;
  location: [number, number]; // [lat, lon] — computed_field бэка
}

// MeasurementHistoryOut из backend/app/schemas/sensors.py
export interface Measurement {
  id: number;
  sensor_id: number;
  value: number;
  metric_name: string;
  quality_status: string;
  created_at: string;
}

// ReportOut из backend/app/schemas/feedback.py
export interface Report {
  id: number;
  user_id: number;
  district_id: number | null;
  category: string;
  description: string;
  status: string;
  created_at: string;
  location: [number, number]; // [lat, lon]
  attachments: ReportAttachment[];
}

export interface ReportAttachment {
  id: number;
  url: string;
}

// IncidentOut из backend/app/schemas/incidents.py
export interface Incident {
  id: number;
  district_id: number;
  title: string;
  status: string;
  confidence_rate: number;
  operator_comment: string | null;
  created_at: string;
  resolved_at: string | null;
  report_ids: number[];
  sensor_ids: number[];
}

// EciStatsSchema из backend/app/schemas/core.py
export interface EciStats {
  air_score: number;
  water_score: number;
  citizen_score: number;
  trend_score: number;
}

// Token из backend/app/schemas/auth.py
export interface Token {
  access_token: string;
  token_type: string;
}

// /auth/me — GET
// /auth/me — GET
export interface CurrentUser {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  full_name: string | null;
  created_at: string | null;
  notify_new_surveys: boolean;
  notify_results: boolean;
  notify_pollution: boolean;
}

// /analytics/dashboard
export interface AreaInfo {
  name: string | null;
  score: number | null;
}

export interface Dashboard {
  active_incidents_count: number;
  total_citizen_reports_count: number;
  cleanest_area: AreaInfo;
  critical_area: AreaInfo;
}

// /maps/districts/{id}/history (патч F1 — добавим на бэке)
export interface EciHistoryPoint {
  calculated_at: string;
  eci_score: number;
}