import { useEffect, useState } from 'react';
import { fetchDistrictStats, fetchDistrictHistory } from '../../api/maps';
import type { District, EciStats, EciHistoryPoint } from '../../types/api';
import { DistrictChart } from './DistrictChart';

interface Props {
  district: District;
  onClose: () => void;
}

const LABELS: Record<keyof EciStats, string> = {
  air_score: 'Воздух (PM2.5)',
  water_score: 'Вода (pH)',
  citizen_score: 'Жители (жалобы)',
  trend_score: 'Тренд',
};

export function DistrictPanel({ district, onClose }: Props) {
  const [stats, setStats] = useState<EciStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  // ДОБАВЛЕНО (Этап 4): история ECI для графика динамики
  const [history, setHistory] = useState<EciHistoryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setStatsLoading(true);
    setStatsError(false);
    fetchDistrictStats(district.id)
      .then((s) => { if (alive) setStats(s); })
      .catch(() => { if (alive) { setStats(null); setStatsError(true); } })
      .finally(() => { if (alive) setStatsLoading(false); });
    return () => { alive = false; };
  }, [district.id]);

  useEffect(() => {
    let alive = true;
    setHistoryLoading(true);
    fetchDistrictHistory(district.id)
      .then((h) => { if (alive) setHistory(h); })
      .catch(() => { if (alive) setHistory([]); })
      .finally(() => { if (alive) setHistoryLoading(false); });
    return () => { alive = false; };
  }, [district.id]);

  return (
    <aside style={{ background: '#1e293b', borderRadius: 16, padding: 20, color: '#f1f5f9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>{district.name}</h2>
        <button onClick={onClose} style={{ background: '#334155', border: 'none', color: '#f1f5f9',
          borderRadius: 8, width: 28, height: 28, cursor: 'pointer' }}>✕</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ width: 16, height: 16, borderRadius: 4, background: district.color_hex }} />
        <span style={{ fontSize: 28, fontWeight: 800 }}>{district.eci_score}</span>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>ECI (выше = чище)</span>
      </div>

      <h3 style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 10px' }}>Компоненты индекса</h3>

      {statsLoading && <div style={{ color: '#64748b', fontSize: 13 }}>Загрузка…</div>}

      {statsError && !statsLoading && (
        <div style={{ color: '#f87171', fontSize: 13 }}>
          Не удалось загрузить компоненты индекса
        </div>
      )}

      {stats && !statsLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(Object.keys(LABELS) as (keyof EciStats)[]).map((key) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 150, fontSize: 13, color: '#94a3b8' }}>{LABELS[key]}</span>
              <div style={{ flex: 1, height: 8, background: '#334155', borderRadius: 4 }}>
                <div style={{ width: `${stats[key]}%`, height: '100%', borderRadius: 4,
                  background: stats[key] >= 75 ? '#22c55e' : stats[key] >= 50 ? '#f59e0b' : '#ef4444' }} />
              </div>
              <span style={{ width: 36, textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{stats[key]}</span>
            </div>
          ))}
        </div>
      )}

      {/* ДОБАВЛЕНО (Этап 4): динамика ECI */}
      <h3 style={{ fontSize: 14, color: '#94a3b8', margin: '20px 0 10px' }}>Динамика ECI</h3>
      {historyLoading
        ? <div style={{ color: '#64748b', fontSize: 13 }}>Загрузка…</div>
        : <DistrictChart data={history} />}
    </aside>
  );
}