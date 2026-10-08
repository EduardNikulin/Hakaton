import { Link } from 'react-router-dom';
import type { Incident } from '../../types/api';
import { normalizeIncidentStatus, INCIDENT_STATUS_META } from '../../utils/status';

// === LEGACY: статический маппинг без CRITICAL/WARNING ===
// const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
//   OPEN: { label: 'Открыт', color: '#f87171', bg: '#7f1d1d' },
//   IN_PROGRESS: { label: 'В работе', color: '#fbbf24', bg: '#78350f' },
//   RESOLVED: { label: 'Решён', color: '#34d399', bg: '#064e3b' },
// };

interface Props {
  incident: Incident;
  districtName?: string;
}

export function IncidentCard({ incident, districtName }: Props) {
  const meta = INCIDENT_STATUS_META[normalizeIncidentStatus(incident.status)];
  // Бэк отдаёт confidence_rate в шкале 0..100 — НЕ умножаем на 100
  const confidence = Math.round(incident.confidence_rate);

  return (
    <Link to={`/incidents/${incident.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <article
        style={{
          background: '#1e293b', borderRadius: 14, padding: 16,
          border: '1px solid #334155', cursor: 'pointer',
          transition: 'border-color .15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#22c55e'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#334155'; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 15, color: '#f1f5f9' }}>{incident.title}</h3>
          <span style={{ flexShrink: 0, padding: '3px 10px', borderRadius: 999, fontSize: 12,
            fontWeight: 600, color: meta.color, background: meta.bg }}>{meta.label}</span>
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, color: '#94a3b8',
          flexWrap: 'wrap' }}>
          <span>📍 {districtName ?? `Район №${incident.district_id}`}</span>
          <span>📊 Достоверность: <b style={{ color: confidence >= 70 ? '#f87171' : '#fbbf24' }}>{confidence}%</b></span>
          <span>👥 Жалоб: {incident.report_ids.length}</span>
          <span>📡 Датчиков: {incident.sensor_ids.length}</span>
          <span>🕒 {new Date(incident.created_at).toLocaleString('ru-RU')}</span>
        </div>
      </article>
    </Link>
  );
}