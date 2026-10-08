import { useEffect, useMemo, useState } from 'react';
import { YMaps, Map, Polygon } from '@pbe/react-yandex-maps';
import { fetchDistricts } from '../../api/maps';
import { geojsonToYandex, polygonCenter, KALUGA_CENTER } from '../../utils/geo';
import type { District } from '../../types/api';

const YMAPS_KEY = import.meta.env.VITE_YMAPS_KEY;

interface LiveMapProps {
  onSelect: (district: District) => void;
  selectedId: number | null;
}

export function LiveMap({ onSelect, selectedId }: LiveMapProps) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Загрузка районов + автообновление каждые 30 с ("карта живёт")
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

  // Центр карты — по среднему всех полигонов (fallback — Калуга)
  const center = useMemo<[number, number]>(() => {
    if (districts.length === 0) return KALUGA_CENTER;
    const all = districts.flatMap((d) => geojsonToYandex(d.polygon_geojson));
    return polygonCenter(all);
  }, [districts]);

  if (loading) return <Panel>Загрузка карты…</Panel>;
  if (error) return <Panel>⚠️ {error}</Panel>;
  if (districts.length === 0) return <Panel>Районов в базе пока нет</Panel>;

  return (
    <div style={{ height: 560, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.25)' }}>
      <YMaps query={{ apikey: YMAPS_KEY, lang: 'ru_RU' }}>
        <Map
          defaultState={{ center, zoom: 12 }}
          width="100%"
          height="100%"
          options={{ suppressMapOpenBlock: true }}
        >
          {districts.map((d) => {
            const coords = geojsonToYandex(d.polygon_geojson); // [lon,lat] → [lat,lon]
            const isSelected = d.id === selectedId;
            return (
              <Polygon
                key={d.id}
                geometry={{ type: 'Polygon', coordinates: [coords] }}
                options={{
                  // Цвет ECI — СТРОГО с бэка (выше = чище)
                  fillColor: d.color_hex + '66',
                  strokeColor: d.color_hex,
                  strokeWidth: isSelected ? 4 : 2,
                }}
                properties={{ hintContent: `${d.name} · ECI: ${d.eci_score}` }}
                onClick={() => onSelect(d)}
              />
            );
          })}
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