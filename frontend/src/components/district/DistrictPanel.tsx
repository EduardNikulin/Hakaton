import { useEffect, useState } from 'react';
import { fetchDistrictStats } from '../../api/maps';
import type { District, EciStats } from '../../types/api';

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

  useEffect(() => {
    let alive = true;
    fetchDistrictStats(district.id)
      .then((s) => { if (alive) setStats(s); })
      .catch(() => { if (alive) setStats(null); });
    return () => { alive = false; };
  }, [district.id]);

  return (
    <aside style={{ background: '#1e293b', borderRadius: 16, padding: 20, color: '#f1f5f9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>{district.name}</h2>
        <button onClick={onClose} style={{ background: '#334155', border: 'none', color: '#f1f5f9',
          borderRadius: 8, width: 28, height: 28, cursor: 'pointer' }}>✕</button>
      </div>

      {/* Главный ECI — цвет с бэка */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ width: 16, height: 16, borderRadius: 4, background: district.color_hex }} />
        <span style={{ fontSize: 28, fontWeight: 800 }}>{district.eci_score}</span>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>ECI (выше = чище)</span>
      </div>

      {/* Компоненты индекса */}
      {stats ? (
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
      ) : (
        <div style={{ color: '#64748b', fontSize: 13 }}>Компоненты индекса…</div>
      )}
    </aside>
  );
}