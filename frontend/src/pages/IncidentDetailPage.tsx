import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchIncident, updateIncidentStatus, fetchIncidentTimeline } from '../api/incidents';
import { fetchDistricts } from '../api/maps';
import { Timeline, type TimelineItem } from '../components/operator/Timeline';
import { useAuth } from '../context/AuthContext';
import type { Incident } from '../types/api';
import { normalizeIncidentStatus, INCIDENT_STATUS_META } from '../utils/status';
import { normalizeRole } from '../utils/roles';

export function IncidentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = normalizeRole(user?.role) === 'admin';

  const [incident, setIncident] = useState<Incident | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [districtName, setDistrictName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!id) return;
    let alive = true;
    const numId = Number(id);
    Promise.all([
      fetchIncident(numId),
      fetchIncidentTimeline(numId).catch(() => []),
      fetchDistricts().catch(() => []),
    ])
      .then(([inc, tl, dist]) => {
        if (!alive) return;
        setIncident(inc);
        setTimeline(tl);
        setComment(inc.operator_comment ?? '');
        setDistrictName(dist.find((d) => d.id === inc.district_id)?.name ?? '');
      })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : 'Ошибка загрузки'); });
    return () => { alive = false; };
  }, [id]);

  const changeStatus = async (newStatus: string) => {
    if (!incident) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateIncidentStatus(incident.id, newStatus, comment || undefined);
      setIncident(updated);
      const tl = await fetchIncidentTimeline(incident.id).catch(() => []);
      setTimeline(tl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось изменить статус');
    } finally {
      setSaving(false);
    }
  };

  if (error && !incident) return <div style={{ color: '#ef4444', maxWidth: 900, margin: '0 auto' }}>{error}</div>;
  if (!incident) return <div style={{ color: 'var(--text-muted)', maxWidth: 900, margin: '0 auto' }}>Загрузка…</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Link to="/incidents" style={{ color: '#22c55e', fontSize: 13, textDecoration: 'none' }}>
        ← К списку инцидентов
      </Link>

      <h1 style={{ fontSize: 22, margin: '12px 0 6px' }}>{incident.title}</h1>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
        📍 {districtName || `Район №${incident.district_id}`} · создан{' '}
        {new Date(incident.created_at).toLocaleString('ru-RU')}
        {incident.resolved_at && <> · решён {new Date(incident.resolved_at).toLocaleString('ru-RU')}</>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Левая колонка: сведения + действия */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <Badge label={`Статус: ${INCIDENT_STATUS_META[normalizeIncidentStatus(incident.status)].label}`} />
            <Badge label={`Достоверность: ${Math.round(incident.confidence_rate)}%`} />
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Привязано жалоб: <b style={{ color: 'var(--text-primary)' }}>{incident.report_ids.join(', ') || '—' }</b>
            <br />
            Датчиков: <b style={{ color: 'var(--text-primary)' }}>{incident.sensor_ids.join(', ') || '—'}</b>
          </div>

          {isAdmin ? (
            <>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Комментарий оператора
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'inherit',
                  boxSizing: 'border-box', marginBottom: 12 }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                {normalizeIncidentStatus(incident.status) !== 'IN_PROGRESS' && (
                  <ActionBtn onClick={() => changeStatus('IN_PROGRESS')} disabled={saving}
                    bg="#f59e0b">В работу</ActionBtn>
                )}
                {normalizeIncidentStatus(incident.status) !== 'RESOLVED' && (
                  <ActionBtn onClick={() => changeStatus('RESOLVED')} disabled={saving}
                    bg="#22c55e">Решено</ActionBtn>
                )}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Смена статуса доступна администратору
            </div>
          )}

          {error && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 10 }}>{error}</div>}
        </div>

        {/* Правая колонка: таймлайн */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 15 }}>Хронология</h2>
          <Timeline items={timeline} />
        </div>
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12,
      background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{label}</span>
  );
}

function ActionBtn({ children, onClick, disabled, bg }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  bg: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: bg,
        color: '#fff', fontWeight: 600, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1 }}>
      {children}
    </button>
  );
}