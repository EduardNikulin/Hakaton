import { useState } from 'react';
import { YMaps, Map, Polygon } from '@pbe/react-yandex-maps';
import { Wind, Droplets, ClipboardList, AlertTriangle } from 'lucide-react';
import { districts, activeSurveysCount } from '../data/mockData';
import { getPollutionColor } from '../utils/pollutionUtils';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import DistrictInfo from '../components/DistrictInfo';

const YANDEX_MAPS_API_KEY = 'ВАШ_API_КЛЮЧ';

export default function HomePage() {
  const [selected, setSelected] = useState(null);
  const totalSensors = districts.reduce((sum, d) => sum + d.sensors.length, 0);
  const dangerCount = districts.filter((d) => d.pollutionLevel > 75).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', transition: 'background .3s' }}>
      <Header />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 0', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatCard icon={<Wind />} label="Районов" value={districts.length} color="#3b82f6" />
        <StatCard icon={<Droplets />} label="Датчиков онлайн" value={totalSensors} color="#0ea5e9" />
        <StatCard icon={<ClipboardList />} label="Активных опросов" value={activeSurveysCount} color="#22c55e" />
        <StatCard icon={<AlertTriangle />} label="Опасных зон" value={dangerCount} color="#ef4444" />
      </div>

      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: 24,
        display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 24,
      }}>
        <div style={{ borderRadius: 20, overflow: 'hidden', height: 600, boxShadow: '0 4px 24px var(--shadow-lg)' }}>
          <YMaps query={{ apikey: YANDEX_MAPS_API_KEY, lang: 'ru_RU' }}>
            <Map defaultState={{ center: [55.751, 37.618], zoom: 11 }} width="100%" height="100%" options={{ suppressMapOpenBlock: true }}>
              {districts.map((d) => (
                <Polygon
                  key={d.id}
                  geometry={{ type: 'Polygon', coordinates: [d.coordinates] }}
                  options={{
                    fillColor: getPollutionColor(d.pollutionLevel) + '66',
                    strokeColor: getPollutionColor(d.pollutionLevel),
                    strokeWidth: selected?.id === d.id ? 4 : 2, cursor: 'pointer',
                  }}
                  properties={{ hintContent: `${d.name} · AQI: ${d.pollutionLevel}` }}
                  onClick={() => setSelected(d)}
                />
              ))}
            </Map>
          </YMaps>
        </div>
        {selected && <DistrictInfo district={selected} onClose={() => setSelected(null)} />}
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Шкала загрязнения:</span>
        {[
          { l: 'Хорошо', c: '#22c55e' }, { l: 'Умеренно', c: '#84cc16' },
          { l: 'Внимание', c: '#eab308' }, { l: 'Плохо', c: '#f97316' }, { l: 'Опасно', c: '#ef4444' },
        ].map((item) => (
          <span key={item.l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: item.c }} />{item.l}
          </span>
        ))}
      </div>
    </div>
  );
}