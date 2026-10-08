import { useState } from 'react';
import { LiveMap } from '../components/map/LiveMap';
import { DistrictPanel } from '../components/district/DistrictPanel';
import type { District } from '../types/api';

export function DashboardPage() {
  const [selected, setSelected] = useState<District | null>(null);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 16 }}>
      <LiveMap onSelect={setSelected} selectedId={selected?.id ?? null} />
      {selected && <DistrictPanel district={selected} onClose={() => setSelected(null)} />}
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 16, alignItems: 'center', fontSize: 13, color: '#94a3b8' }}>
        <span style={{ fontWeight: 600 }}>ECI (выше = чище):</span>
        <Legend color="#22c55e" label="≥ 75 — чисто" />
        <Legend color="#f59e0b" label="≥ 50 — средне" />
        <Legend color="#ef4444" label="< 50 — плохо" />
      </div>
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