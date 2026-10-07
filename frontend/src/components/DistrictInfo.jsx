import { X, Wind, Droplets } from 'lucide-react';
import PollutionBadge from './PollutionBadge';
import SensorChart from './SensorChart';
import { getStatusColor, getStatusLabel } from '../utils/pollutionUtils';

export default function DistrictInfo({ district, onClose }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: 28,
      boxShadow: '0 4px 24px rgba(0,0,0,.08)',
      maxHeight: 600, overflowY: 'auto',
      animation: 'slideIn .3s ease',
    }}>
      {/* Шапка панели */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{district.name}</h2>
          <div style={{ marginTop: 8 }}>
            <PollutionBadge level={district.pollutionLevel} />
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

      {/* График AQI */}
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#374151' }}>
        📈 Динамика загрязнения (AQI)
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {s.type === 'air' ? <Wind size={16} color="#3b82f6" /> : <Droplets size={16} color="#0ea5e9" />}
              <span style={{ fontSize: 14, fontWeight: 500 }}>{s.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>
                {s.value} <small style={{ fontWeight: 400, color: '#9ca3af' }}>{s.unit}</small>
              </span>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                background: getStatusColor(s.status) + '20',
                color: getStatusColor(s.status),
              }}>
                {getStatusLabel(s.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}