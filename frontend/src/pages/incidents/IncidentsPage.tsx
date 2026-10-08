import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchIncidents } from '../../api/incidents';
import { fetchDistricts } from '../../api/maps';
import { IncidentCard } from '../../components/operator/IncidentCard';
import type { Incident, District } from '../../types/api';
import { normalizeIncidentStatus } from '../../utils/status';

type Filter = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

const TABS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'Все' },
  { key: 'OPEN', label: 'Открытые' },
  { key: 'IN_PROGRESS', label: 'В работе' },
  { key: 'RESOLVED', label: 'Решённые' },
];

export function IncidentsPage({ title = '🚨 Инциденты' }: { title?: string }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = () => {
      Promise.all([fetchIncidents(), fetchDistricts()])
        .then(([inc, dist]) => { if (alive) { setIncidents(inc); setDistricts(dist); setError(''); } })
        .catch((e) => { if (alive) setError(e instanceof Error ? e.message : 'Ошибка загрузки'); })
        .finally(() => { if (alive) setLoading(false); });
    };
    load();
    // ДОБАВЛЕНО (Этап 6): поллинг — отслеживание инцидентов в реальном времени
    const timer = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  const districtNames = useMemo(
    () => Object.fromEntries(districts.map((d) => [d.id, d.name])) as Record<number, string>,
    [districts],
  );

  const visible = useMemo(
    () => (filter === 'ALL'
      ? incidents
      : incidents.filter((i) => normalizeIncidentStatus(i.status) === filter)),
    [incidents, filter],
  );

  // Счётчики по табам (по нормализованному статусу — учитывает CRITICAL/WARNING)
  const counts = useMemo(() => ({
    ALL: incidents.length,
    OPEN: incidents.filter((i) => normalizeIncidentStatus(i.status) === 'OPEN').length,
    IN_PROGRESS: incidents.filter((i) => normalizeIncidentStatus(i.status) === 'IN_PROGRESS').length,
    RESOLVED: incidents.filter((i) => normalizeIncidentStatus(i.status) === 'RESOLVED').length,
  }), [incidents]) as Record<Filter, number>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>{title}</h1>
        <Link to="/" style={{ color: '#22c55e', fontSize: 14, textDecoration: 'none' }}>← На карту</Link>
      </div>

      {/* Табы-фильтры */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              border: filter === t.key ? '1px solid #22c55e' : '1px solid #334155',
              background: filter === t.key ? '#14532d' : 'transparent',
              color: filter === t.key ? '#86efac' : '#94a3b8', fontWeight: 600 }}>
            {t.label} {counts[t.key]}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: '#64748b' }}>Загрузка…</div>}
      {error && <div style={{ color: '#ef4444' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visible.map((i) => (
          <IncidentCard key={i.id} incident={i} districtName={districtNames[i.district_id]} />
        ))}
        {!loading && !error && visible.length === 0 && (
          <div style={{ color: '#64748b', fontSize: 14, padding: 24, textAlign: 'center',
            background: '#1e293b', borderRadius: 14 }}>Инцидентов нет 🎉</div>
        )}
      </div>
    </div>
  );
}