import { X, Wind, Droplets } from 'lucide-react';
import PollutionBadge from './PollutionBadge';
import SensorChart from './SensorChart';

export default function DistrictInfo({ district, onClose }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: 28,
      boxShadow: '0 4px 24px rgba(0,0,0,.08)',
      maxHeight: 600, overflowY: 'auto',
    }}>
      {/* Шапка */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{district.name}</h2>
          <div style={{ marginTop: 8 }}>
            <PollutionBadge level={district.eci_score} />
          </div>
        </div>
        <button onClick={onClose} style={{
          background: '#f3f4f6', border: 'none', borderRadius: 10,
          width: 36, height: 36, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <X size={18} />
        </button>
      </div>

      {/* График */}
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#374151' }}>
        📈 Динамика ECI
      </h3>
      <SensorChart data={district.history} />

      {/* Датчики */}
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: '24px 0 12px', color: '#374151' }}>
        🔬 Показания датчиков
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {district.sensors.map((s) => (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderRadius: 12, background: '#f9fafb',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              {s.type === 'air'
                ? <Wind size={16} color="#3b82f6" />
                : <Droplets size={16} color="#0ea5e9" />}
              <span style={{
                fontSize: 14, fontWeight: 500,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {s.name}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              {s.value != null ? (
                <span style={{ fontSize: 15, fontWeight: 700 }}>
                  {typeof s.value === 'number' ? s.value.toFixed(1) : s.value}
                  <small style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 4 }}>
                    {s.unit}
                  </small>
                </span>
              ) : (
                <span style={{ fontSize: 13, color: '#9ca3af' }}>нет данных</span>
              )}

              {s.metricLabel && (
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px',
                  borderRadius: 6, background: '#e0f2fe', color: '#0369a1',
                }}>
                  {s.metricLabel}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}