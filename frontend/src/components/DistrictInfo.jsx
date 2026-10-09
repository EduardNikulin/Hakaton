import { X, Wind, Droplets } from 'lucide-react';
import PollutionBadge from './PollutionBadge';
import SensorChart from './SensorChart';

// Статусы датчиков (упрощённые — бэк пока не отдаёт статусы)
function getStatusColor(status) {
  const colors = {
    good: '#22c55e',
    normal: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    suspect: '#f97316',
  };
  return colors[status] ?? '#6b7280';
}

function getStatusLabel(status) {
  const labels = {
    good: 'Хорошо',
    normal: 'Норма',
    warning: 'Внимание',
    danger: 'Опасно',
    suspect: 'Аномалия',
  };
  return labels[status] ?? status ?? '—';
}
export default function DistrictInfo({ district, onClose }) {
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 20, padding: 28,
      boxShadow: '0 4px 24px var(--shadow-lg)',
      maxHeight: 600, overflowY: 'auto', animation: 'slideIn .3s ease',
      transition: 'background .3s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{district.name}</h2>
          <div style={{ marginTop: 8 }}><PollutionBadge level={district.pollutionLevel} /></div>
        </div>
        <button onClick={onClose} style={{
          background: 'var(--bg-secondary)', border: 'none', borderRadius: 10,
          width: 36, height: 36, cursor: 'pointer', color: 'var(--text-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <X size={18} />
        </button>
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
        📈 Динамика загрязнения (AQI)
      </h3>
      <SensorChart data={district.history} />

      <h3 style={{ fontSize: 15, fontWeight: 600, margin: '24px 0 12px', color: 'var(--text-primary)' }}>
        🔬 Показания датчиков
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {district.sensors.map((s) => (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderRadius: 12, background: 'var(--bg-hover)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {s.type === 'air' ? <Wind size={16} color="#3b82f6" /> : <Droplets size={16} color="#0ea5e9" />}
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{s.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                {s.value} <small style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{s.unit}</small>
              </span>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                background: getStatusColor(s.status) + '20', color: getStatusColor(s.status),
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