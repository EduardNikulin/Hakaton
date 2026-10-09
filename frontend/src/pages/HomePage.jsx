import { useState, useEffect } from 'react';
import { YMaps, Map, Polygon, Placemark } from '@pbe/react-yandex-maps';
import { Wind, Droplets, ClipboardList, AlertTriangle, Plus } from 'lucide-react';
import { fetchDistricts, fetchSensors, fetchReports, fetchSensorHistory } from '../api/maps';
import { buildDistricts, buildReports, sensorColor } from '../utils/adapters';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import DistrictInfo from '../components/DistrictInfo';
import ReportModal from '../components/feedback/ReportModal';
import { feedbackApi } from '../api/feedback';

const YANDEX_MAPS_API_KEY = import.meta.env.VITE_YMAPS_KEY;
const KALUGA_CENTER = [54.5293, 36.2754];

// Фронт шлёт русские названия → бэк ждёт английские
const mapCategory = (label) => {
  const map = {
    'Запах': 'air',
    'Мусор': 'waste',
    'Сливы': 'water',
    'Шум': 'noise',
    'Другое': 'other',
  };
  return map[label] ?? 'other';
};

export default function HomePage() {
  const [districts, setDistricts] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState(null);
  const [reportMode, setReportMode] = useState(false);
  const [pendingPoint, setPendingPoint] = useState(null);

  useEffect(() => {
    Promise.all([fetchDistricts(), fetchSensors(), fetchReports()])
      .then(async ([d, s, r]) => {
        const histories = await Promise.all(
          s.map((sensor) => fetchSensorHistory(sensor.id).catch(() => []))
        );
        setDistricts(buildDistricts(d, s, histories));
        setReports(buildReports(r));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleMapClick = (e) => {
    if (!reportMode) return;
    const [lat, lon] = e.get('coords');
    setPendingPoint({ lat, lon });
  };

  const handleSubmitReport = async (data) => {
    const body = {
      category: mapCategory(data.category),
      description: data.text,
      location: [data.coords[0], data.coords[1]],
    };

    const created = await feedbackApi.createReport(body);

    setReports((prev) => [
      ...prev,
      {
        id: created.id,
        category: data.category,
        status: created.status ?? 'NEW',
        coords: created.location ?? data.coords,
        districtId: created.district_id,
        text: created.description ?? data.text,
      },
    ]);

    setPendingPoint(null);
    setReportMode(false);
  };

  const totalSensors = districts.reduce((sum, d) => sum + d.sensors.length, 0);
  const dangerCount = districts.filter((d) => d.eci_score < 50).length;

  // Уникальные датчики (один датчик может быть в двух районах)
  const uniqueSensors = districts
    .flatMap((d) => d.sensors)
    .reduce((acc, s) => {
      if (!acc.find((x) => x.id === s.id)) acc.push(s);
      return acc;
    }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-secondary)',
      }}>
        Загрузка данных...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#ef4444',
      }}>
        Ошибка: {error}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', transition: 'background .3s' }}>
      <Header />

      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '24px 24px 0',
        display: 'flex', gap: 16, flexWrap: 'wrap',
      }}>
        <StatCard icon={<Wind />} label="Районов" value={districts.length} color="#3b82f6" />
        <StatCard icon={<Droplets />} label="Датчиков онлайн" value={totalSensors} color="#0ea5e9" />
        <StatCard icon={<ClipboardList />} label="Активных опросов" value={2} color="#22c55e" />
        <StatCard icon={<AlertTriangle />} label="Опасных зон" value={dangerCount} color="#ef4444" />
      </div>

      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: 24,
        display: 'grid',
        gridTemplateColumns: selected ? '1fr 420px' : '1fr',
        gap: 24,
      }}>
        <div style={{
          position: 'relative',
          borderRadius: 20, overflow: 'hidden', height: 600,
          boxShadow: '0 4px 24px var(--shadow-lg)',
        }}>
          <button
            onClick={() => setReportMode((m) => !m)}
            style={{
              position: 'absolute', top: 16, right: 16, zIndex: 1000,
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 20px', borderRadius: 12,
              background: reportMode ? '#ef4444' : '#22c55e',
              color: '#ffffff',
              border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 14,
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              fontFamily: 'system-ui, sans-serif',
              transition: 'background .2s',
            }}
          >
            <Plus size={18} color="#ffffff" />
            {reportMode ? 'Отменить' : 'Сообщить о проблеме'}
          </button>

          <YMaps query={{ apikey: YANDEX_MAPS_API_KEY, lang: 'ru_RU' }}>
            <Map
              defaultState={{ center: KALUGA_CENTER, zoom: 12 }}
              width="100%" height="100%"
              options={{ suppressMapOpenBlock: true }}
              modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
              onClick={handleMapClick}
            >
              {/* Полигоны районов */}
              {districts.map((d) => (
                <Polygon
                  key={d.id}
                  geometry={{ type: 'Polygon', coordinates: [d.coordinates] }}
                  options={{
                    fillColor: d.color_hex + '66',
                    strokeColor: d.color_hex,
                    strokeWidth: selected?.id === d.id ? 4 : 2,
                    cursor: reportMode ? 'crosshair' : 'pointer',
                  }}
                  properties={{ hintContent: `${d.name} · ECI: ${d.eci_score}` }}
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

              {/* Датчики */}
              {uniqueSensors.map((s) => (
                <Placemark
                  key={`sensor-${s.id}`}
                  geometry={s.coords}
                  properties={{
                    hintContent: `${s.name} · ${s.value ?? '—'} ${s.unit}`,
                    balloonContent: `
                      <div style="font-family:system-ui;min-width:180px">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${sensorColor(s)}"></span>
                          <b>${s.name}</b>
                        </div>
                        <div style="color:#666;font-size:12px;margin-bottom:8px">
                          ${s.type === 'air' ? 'Воздух' : 'Вода'}
                        </div>
                        ${Object.entries(s.allMetrics || {}).map(([k, v]) => {
                          const label = k.toUpperCase();
                          const unit =
                            k === 'pm25' || k === 'pm10' || k === 'no2' || k === 'so2'
                              ? 'мкг/м³'
                              : k === 'co' ? 'мг/м³' : '';
                          return `<div>${label}: <b>${v}</b> ${unit}</div>`;
                        }).join('')}
                      </div>
                    `,
                  }}
                  options={{
                    preset: 'islands#icon',
                    iconColor: sensorColor(s),
                  }}
                  onClick={(e) => {
                    if (reportMode) {
                      const [lat, lon] = e.get('coords');
                      setPendingPoint({ lat, lon });
                    }
                  }}
                />
              ))}

              {/* Жалобы */}
              {reports.map((r) => (
                <Placemark
                  key={r.id}
                  geometry={r.coords}
                  properties={{
                    hintContent: `${r.category} · ${r.status}`,
                    balloonContent: `
                      <b>${r.category}</b><br/>
                      Статус: ${r.status}<br/>
                      ${r.text ? `<small>${r.text}</small>` : ''}
                    `,
                  }}
                  options={{
                    preset: 'islands#circleDotIcon',
                    iconColor:
                      r.status === 'NEW' ? '#3b82f6'
                      : r.status === 'IN_PROGRESS' ? '#fbbf24'
                      : '#10b981',
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

        {selected && (
          <DistrictInfo district={selected} onClose={() => setSelected(null)} />
        )}
      </div>

      {/* Легенды */}
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 24px 32px',
        display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          Шкала ECI:
        </span>
        {[
  { l: '0–49',   c: '#ef4444' },  // плохо
  { l: '50–74',  c: '#f59e0b' },  // средне
  { l: '75–100', c: '#22c55e' },  // хорошо
].map((item) => (
          <span
            key={item.l}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, color: 'var(--text-secondary)',
            }}
          >
            <span style={{ width: 14, height: 14, borderRadius: 4, background: item.c }} />
            {item.l}
          </span>
        ))}

        <span style={{
          fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
          marginLeft: 24,
        }}>
          Датчики:
        </span>
        {[
          { l: 'Хорошо',     c: '#22c55e' },
          { l: 'Умеренно',   c: '#fbbf24' },
          { l: 'Внимание',   c: '#f97316' },
          { l: 'Опасно',     c: '#ef4444' },
          { l: 'Нет данных', c: '#6b7280' },
        ].map((item) => (
          <span
            key={item.l}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, color: 'var(--text-secondary)',
            }}
          >
            <span style={{
              width: 12, height: 12, borderRadius: '50%',
              background: item.c,
              boxShadow: `0 0 0 2px ${item.c}33`,
            }} />
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