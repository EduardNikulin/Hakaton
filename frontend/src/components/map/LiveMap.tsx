import { useEffect, useMemo, useState } from 'react';
import { YMaps, Map, Polygon, Placemark } from '@pbe/react-yandex-maps';
import { fetchDistricts } from '../../api/maps';
import { fetchSensors } from '../../api/sensors';
import { fetchReports } from '../../api/reports';
import { fetchIncidents } from '../../api/incidents';
import { getToken } from '../../api/client';
import { geojsonToYandex, polygonCenter, KALUGA_CENTER } from '../../utils/geo';
import type { District, Report, Sensor, Incident } from '../../types/api';
import { ReportMarkers } from './ReportMarkers';
import { SensorMarkers } from './SensorMarker';
import { IncidentMarkers } from './IncidentMarker';

const YMAPS_KEY = import.meta.env.VITE_YMAPS_KEY;

type MapEvent = { get: (key: string) => unknown };

interface LiveMapProps {
  onSelect: (district: District) => void;
  selectedId: number | null;
  reportMode: boolean;
  onMapPick: (point: { lat: number; lon: number }) => void;
  pendingPoint: { lat: number; lon: number } | null;
  refreshKey: number;
  // ДОБАВЛЕНО (Этап 5): жалобы, добавленные оптимистично (до рефетча)
  extraReports?: Report[];
}

export function LiveMap({
  onSelect, selectedId, reportMode, onMapPick, pendingPoint, refreshKey, extraReports = [],
}: LiveMapProps) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  // ДОБАВЛЕНО (Этап 4): датчики с реальными координатами
  const [sensors, setSensors] = useState<Sensor[]>([]);
  // ДОБАВЛЕНО (Этап 6): инциденты для маркеров на карте
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Инстанс карты — нужен для управления курсором
  const [mapInstance, setMapInstance] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const data = await fetchDistricts();
        if (alive) { setDistricts(data); setError(null); }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Ошибка загрузки районов');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  // ДОБАВЛЕНО (Этап 4): загрузка датчиков + поллинг (карта «живёт»)
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const data = await fetchSensors();
        if (alive) setSensors(data);
      } catch {
        if (alive) setSensors([]);
      }
    };
    load();
    const timer = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    let alive = true;
    fetchReports()
      .then((r) => { if (alive) setReports(r); })
      .catch(() => { if (alive) setReports([]); });
    return () => { alive = false; };
  }, [refreshKey]);

  // ДОБАВЛЕНО (Этап 6): загрузка инцидентов + поллинг
  useEffect(() => {
    if (!getToken()) return;
    let alive = true;
    const load = () => {
      fetchIncidents()
        .then((r) => { if (alive) setIncidents(r); })
        .catch(() => { if (alive) setIncidents([]); });
    };
    load();
    const timer = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(timer); };
  }, [refreshKey]);

  // Курсор на ВСЕЙ карте через CursorManager: push() при входе, pop() при выходе.
  // ВАЖНО: у CursorManager нет remove(key) — только push()/pop().
  useEffect(() => {
    const cursors = mapInstance?.cursors;
    if (!cursors) return;
    if (typeof cursors.push === 'function') {
      cursors.push(reportMode ? 'crosshair' : 'grab');
    }
    return () => {
      if (typeof cursors.pop === 'function') cursors.pop();
    };
  }, [mapInstance, reportMode]);

  const center = useMemo<[number, number]>(() => {
    if (districts.length === 0) return KALUGA_CENTER;
    const all = districts.flatMap((d) => geojsonToYandex(d.polygon_geojson));
    return polygonCenter(all);
  }, [districts]);

  // ДОБАВЛЕНО (Этап 4): карта id района → имя (для балунов датчиков)
  const districtNames = useMemo<Record<number, string>>(
    () => Object.fromEntries(districts.map((d) => [d.id, d.name])),
    [districts],
  );

  // ДОБАВЛЕНО (Этап 5): объединяем серверные и оптимистичные жалобы без дублей.
  // ВАЖНО: здесь НЕ используем JS Map — имя "Map" занято компонентом карты
  // из @pbe/react-yandex-maps, поэтому дедупликация через обычный объект.
  const allReports = useMemo<Report[]>(() => {
    const byId: Record<number, Report> = {};
    reports.forEach((r) => { byId[r.id] = r; });
    extraReports.forEach((r) => { byId[r.id] = r; });
    return Object.values(byId);
  }, [reports, extraReports]);

  const pickFromEvent = (e: MapEvent) => {
    const coords = e.get('coords') as [number, number] | undefined;
    if (coords) onMapPick({ lat: coords[0], lon: coords[1] });
  };

  if (loading) return <Panel>Загрузка карты…</Panel>;
  if (error) return <Panel>⚠️ {error}</Panel>;
  if (districts.length === 0) return <Panel>Районов в базе пока нет</Panel>;

  return (
    <div style={{ position: 'relative', height: 560, borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,.25)',
      outline: reportMode ? '3px solid #22c55e' : 'none' }}>
      {reportMode && (
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, background: '#22c55e', color: '#fff', padding: '8px 16px',
          borderRadius: 10, fontSize: 13, fontWeight: 600, pointerEvents: 'none' }}>
          Нажмите на карту, где проблема
        </div>
      )}
      <YMaps query={{ apikey: YMAPS_KEY, lang: 'ru_RU' }}>
        <Map
          instanceRef={(m) => setMapInstance(m)}
          defaultState={{ center, zoom: 12 }}
          width="100%"
          height="100%"
          modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
          options={{ suppressMapOpenBlock: true }}
          onClick={(e: MapEvent) => { if (reportMode) pickFromEvent(e); }}
        >
          {districts.map((d) => {
            const coords = geojsonToYandex(d.polygon_geojson);
            return (
              <Polygon
                key={d.id}
                geometry={{ type: 'Polygon', coordinates: [coords] }}
                options={{
                  fillColor: d.color_hex + '66',
                  strokeColor: d.color_hex,
                  strokeWidth: d.id === selectedId ? 4 : 2,
                  cursor: reportMode ? 'crosshair' : 'pointer',
                }}
                properties={{ hintContent: `${d.name} · ECI: ${d.eci_score}` }}
                onClick={(e: MapEvent) => {
                  if (reportMode) {
                    pickFromEvent(e);
                  } else {
                    onSelect(d);
                  }
                }}
              />
            );
          })}

          {/* ДОБАВЛЕНО (Этап 4): датчики */}
          <SensorMarkers
            sensors={sensors}
            reportMode={reportMode}
            onPick={onMapPick}
            districtNames={districtNames}
          />

          <ReportMarkers reports={allReports} reportMode={reportMode} onPick={onMapPick} />

          {/* ДОБАВЛЕНО (Этап 6): маркеры активных инцидентов */}
          <IncidentMarkers
            incidents={incidents}
            districts={districts}
            reportMode={reportMode}
            onPick={onMapPick}
          />

          {pendingPoint && (
            <Placemark
              geometry={[pendingPoint.lat, pendingPoint.lon]}
              options={{ preset: 'islands#redDotIcon' }}
            />
          )}
        </Map>
      </YMaps>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: 560, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1e293b', borderRadius: 16, color: '#94a3b8', fontSize: 15 }}>
      {children}
    </div>
  );
}