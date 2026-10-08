import { useState } from 'react';
import { LiveMap } from '../components/map/LiveMap';
import { DistrictPanel } from '../components/district/DistrictPanel';
import { ReportModal } from '../components/reports/ReportModal';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { District } from '../types/api';

export function DashboardPage() {
  const [selected, setSelected] = useState<District | null>(null);
  const [reportMode, setReportMode] = useState(false);
  const [pendingPoint, setPendingPoint] = useState<{ lat: number; lon: number } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const startReport = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setReportMode((m) => !m);
  };

  return (
    // Контейнер с maxWidth — карта центрируется и не растягивается за экран
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selected ? 'minmax(0, 1fr) 380px' : 'minmax(0, 1fr)',
          gap: 16,
          marginBottom: 12,
          alignItems: 'start',
        }}
      >
        {/* minWidth: 0 — ключевой фикс горизонтального overflow */}
        <div style={{ position: 'relative', minWidth: 0 }}>
          <button
            onClick={startReport}
            style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, padding: '10px 18px',
              borderRadius: 10, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              background: reportMode ? '#ef4444' : '#22c55e', color: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,.3)' }}>
            {reportMode ? 'Отменить' : '+ Сообщить о проблеме'}
          </button>
          <LiveMap
            onSelect={setSelected}
            selectedId={selected?.id ?? null}
            reportMode={reportMode}
            onMapPick={setPendingPoint}
            pendingPoint={pendingPoint}
            refreshKey={refreshKey}
          />
        </div>

        {selected && (
          <div style={{ minWidth: 0 }}>
            <DistrictPanel district={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', fontSize: 13, color: '#94a3b8' }}>
        <span style={{ fontWeight: 600 }}>ECI (выше = чище):</span>
        <Legend color="#22c55e" label="≥ 75 — чисто" />
        <Legend color="#f59e0b" label="≥ 50 — средне" />
        <Legend color="#ef4444" label="< 50 — плохо" />
        <span style={{ marginLeft: 24, fontWeight: 600 }}>Датчики:</span>
        <Legend color="#6366f1" label="воздух" />
        <Legend color="#06b6d4" label="вода" />
        <span style={{ marginLeft: 24, fontWeight: 600 }}>Жалобы:</span>
        <Legend color="#3b82f6" label="новая" />
        <Legend color="#fbbf24" label="в работе" />
        <Legend color="#10b981" label="решена" />
      </div>

      {pendingPoint && (
        <ReportModal
          point={pendingPoint}
          onClose={() => { setPendingPoint(null); setReportMode(false); }}
          onCreated={() => {
            setPendingPoint(null);
            setReportMode(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
      {label}
    </span>
  );
}