import { Link } from 'react-router-dom';
import type { Incident } from '../../types/api';
import { normalizeIncidentStatus, INCIDENT_STATUS_META } from '../../utils/status';

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
          background: 'var(--bg-card)', borderRadius: 14, padding: 16,
          border: '1px solid var(--border)', cursor: 'pointer',
          transition: 'border-color .15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#22c55e'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 15, color: 'var(--text-primary)' }}>{incident.title}</h3>
          <span style={{ flexShrink: 0, padding: '3px 10px', borderRadius: 999, fontSize: 12,
            fontWeight: 600, color: meta.color, background: meta.bg }}>{meta.label}</span>
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, color: 'var(--text-secondary)',
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