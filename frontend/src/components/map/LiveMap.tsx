import { useEffect, useMemo, useState } from 'react';
import { YMaps, Map, Polygon, Placemark } from '@pbe/react-yandex-maps';
import { fetchDistricts } from '../../api/maps';
import { fetchReports } from '../../api/reports';
import { getToken } from '../../api/client';
import { geojsonToYandex, polygonCenter, KALUGA_CENTER } from '../../utils/geo';
import type { District, Report } from '../../types/api';
import { ReportMarkers } from './ReportMarkers';

const YMAPS_KEY = import.meta.env.VITE_YMAPS_KEY;

// Минимальный тип события Яндекс.Карт
type MapEvent = { get: (key: string) => unknown };

interface LiveMapProps {
  onSelect: (district: District) => void;
  selectedId: number | null;
  reportMode: boolean;
  onMapPick: (point: { lat: number; lon: number }) => void;
  pendingPoint: { lat: number; lon: number } | null;
  refreshKey: number;
}

export function LiveMap({
  onSelect, selectedId, reportMode, onMapPick, pendingPoint, refreshKey,
}: LiveMapProps) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!getToken()) return;
    let alive = true;
    fetchReports()
      .then((r) => { if (alive) setReports(r); })
      .catch(() => { if (alive) setReports([]); });
    return () => { alive = false; };
  }, [refreshKey]);

  const center = useMemo<[number, number]>(() => {
    if (districts.length === 0) return KALUGA_CENTER;
    const all = districts.flatMap((d) => geojsonToYandex(d.polygon_geojson));
    return polygonCenter(all);
  }, [districts]);

  // Достаём координаты клика из события карты/гео-объекта
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
          borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
          Нажмите на карту, где проблема
        </div>
      )}
      <YMaps query={{ apikey: YMAPS_KEY, lang: 'ru_RU' }}>
        <Map
          defaultState={{ center, zoom: 12 }}
          width="100%"
          height="100%"
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
                // ГЛАВНЫЙ ФИКС: клик по району работает в обоих режимах
                onClick={(e: MapEvent) => {
                  if (reportMode) {
                    pickFromEvent(e);      // режим жалобы → ставим точку
                  } else {
                    onSelect(d);           // обычный режим → открываем панель района
                  }
                }}
              />
            );
          })}

          <ReportMarkers reports={reports} reportMode={reportMode} onPick={onMapPick} />

          {/* Точка, выбранная для жалобы — видна до отправки */}
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