import { useState } from 'react';
import { YMaps, Map, Polygon, Placemark } from '@pbe/react-yandex-maps';
import { Wind, Droplets, ClipboardList, AlertTriangle, Plus } from 'lucide-react';
import { districts, activeSurveysCount, reports as mockReports } from '../data/mockData';
import { getPollutionColor } from '../utils/pollutionUtils';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import DistrictInfo from '../components/DistrictInfo';
import ReportModal from '../components/feedback/ReportModal';


// ⚠️ Вставьте свой API-ключ Яндекс Карт
const YANDEX_MAPS_API_KEY = import.meta.env.VITE_YMAPS_KEY;

export default function HomePage() {
  const [selected, setSelected] = useState(null);
  const [reports, setReports] = useState(mockReports);
const [reportMode, setReportMode] = useState(false);
const [pendingPoint, setPendingPoint] = useState(null);

const handleMapClick = (e) => {
  if (!reportMode) return;
  const [lat, lon] = e.get('coords');
  setPendingPoint({ lat, lon });
};

const handleSubmitReport = (data) => {
  const newReport = {
    id: `r-${Date.now()}`,
    category: data.category,
    status: 'NEW',
    coords: data.coords,
    districtId: 'central', // TODO: заменить на реальный ST_Contains с бэка
    text: data.text,
    photoName: data.photoName,
  };
  setReports(prev => [...prev, newReport]);
  setPendingPoint(null);
  setReportMode(false);
};

  // Считаем общую статистику
  const totalSensors = districts.reduce((sum, d) => sum + d.sensors.length, 0);
  const dangerCount = districts.filter((d) => d.pollutionLevel > 75).length;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header />

      {/* Статистика */}
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '24px 24px 0',
        display: 'flex', gap: 16, flexWrap: 'wrap',
      }}>
        <StatCard icon={<Wind />}          label="Районов"          value={districts.length}    color="#3b82f6" />
        <StatCard icon={<Droplets />}      label="Датчиков онлайн"  value={totalSensors}        color="#0ea5e9" />
        <StatCard icon={<ClipboardList />} label="Активных опросов" value={activeSurveysCount}  color="#22c55e" />
        <StatCard icon={<AlertTriangle />} label="Опасных зон"      value={dangerCount}         color="#ef4444" />
      </div>

      {/* Карта + боковая панель */}
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: 24,
        display: 'grid',
        gridTemplateColumns: selected ? '1fr 420px' : '1fr',
        gap: 24,
      }}>
        {/* Карта */}
       <div style={{
  position: 'relative',
  borderRadius: 20, overflow: 'hidden', height: 600,
  boxShadow: '0 4px 24px rgba(0,0,0,.08)',
}}>
  {/* Кнопка — поверх карты */}
  <button
    onClick={() => setReportMode(m => !m)}
    style={{
      position: 'absolute', top: 16, right: 16, zIndex: 10,
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 18px', borderRadius: 12,
      background: reportMode ? '#ef4444' : '#22c55e',
      color: 'white', border: 'none', cursor: 'pointer',
      fontWeight: 600, fontSize: 14,
      boxShadow: '0 4px 12px rgba(0,0,0,.15)',
      fontFamily: 'system-ui, sans-serif',
    }}
  >
    <Plus size={18} />
    {reportMode ? 'Отменить' : 'Сообщить о проблеме'}
  </button>
          <YMaps query={{ apikey: YANDEX_MAPS_API_KEY, lang: 'ru_RU' }}>
            <Map
            
              defaultState={{ center: [55.751, 37.618], zoom: 11 }}
              width="100%" height="100%"
              options={{ suppressMapOpenBlock: true }}
              modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
              onClick={handleMapClick}
            >
              {districts.map((d) => (
                <Polygon
                  key={d.id}
                  geometry={{ type: 'Polygon', coordinates: [d.coordinates] }}
                  options={{
                    fillColor: getPollutionColor(d.pollutionLevel) + '66', // полупрозрачность
                    strokeColor: getPollutionColor(d.pollutionLevel),
                    strokeWidth: selected?.id === d.id ? 4 : 2,
                    cursor: 'pointer',
                  }}
                  properties={{ hintContent: `${d.name} · AQI: ${d.pollutionLevel}` }}
                  onClick={(e) => {
  if (reportMode) {
    const [lat, lon] = e.get('coords');
    setPendingPoint({ lat, lon });
  } else {
    setSelected(d);
  }
}}
                />
              ))}
              {districts.flatMap((d) =>
  d.sensors.map((s, idx) => {
    // Расставляем датчики внутри полигона веером
const [tl, tr, br, bl] = d.coordinates;
const centerLat = (tl[0] + br[0]) / 2;
const centerLon = (tl[1] + tr[1]) / 2;
const angle = (idx / d.sensors.length) * 2 * Math.PI; // равномерно по кругу
const radius = 0.01; // ~1 км
const lat = centerLat + radius * Math.sin(angle);
const lon = centerLon + radius * Math.cos(angle);

    return (
      <Placemark
        key={s.id}
        geometry={[lat, lon]}
        properties={{
          hintContent: `${s.name}: ${s.value} ${s.unit}`,
          balloonContent: `
            <b>${s.name}</b><br/>
            Значение: <b>${s.value} ${s.unit}</b><br/>
            Статус: ${s.status}
          `,
        }}
        options={{
          preset: s.type === 'water'
            ? 'islands#aquaIcon'
            : s.status === 'danger'  ? 'islands#redIcon'
            : s.status === 'warning' ? 'islands#orangeIcon'
            : 'islands#blueIcon',
          iconColor: s.status === 'danger' ? '#ef4444' : undefined,
        }}
        onClick={(e) => {
    if (reportMode) {
      const [lat, lon] = e.get('coords');
      setPendingPoint({ lat, lon });
    }
  }}
      />
    );
  })
)}  
{reports.map((r) => (
  <Placemark
    key={r.id}
    geometry={r.coords}
    properties={{
      hintContent: `${r.category} · ${r.status}`,
      balloonContent: `
        <b>${r.category}</b><br/>
        Статус: ${r.status}<br/>
        Район: ${r.districtId}
      `,
    }}
    options={{
      preset: 'islands#circleDotIcon',
      iconColor:
        r.status === 'NEW'         ? '#3b82f6'
        : r.status === 'IN_PROGRESS' ? '#fbbf24'
        :                              '#10b981',
    }}
    onClick={(e) => {
    if (reportMode) {
      const [lat, lon] = e.get('coords');
      setPendingPoint({ lat, lon });
    }
  }}
  />
))}        
            </Map>
          </YMaps>
        </div>

        {/* Боковая панель (появляется при клике) */}
        {selected && <DistrictInfo district={selected} onClose={() => setSelected(null)} />}
      </div>

      {/* Легенда */}
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 24px 32px',
        display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Шкала загрязнения:</span>
        {[
          { l: 'Хорошо',  c: '#22c55e' },
          { l: 'Умеренно', c: '#84cc16' },
          { l: 'Внимание', c: '#eab308' },
          { l: 'Плохо',   c: '#f97316' },
          { l: 'Опасно', c: '#ef4444' },
        ].map((item) => (
          <span key={item.l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: item.c }} />
            {item.l}
          </span>
        ))}
      </div>
      {pendingPoint && (
  <ReportModal
    point={pendingPoint}
    onClose={() => { setPendingPoint(null); setReportMode(false); }}
    onSubmit={handleSubmitReport}
  />
)}
    </div>
  );
}