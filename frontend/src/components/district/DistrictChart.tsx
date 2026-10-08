import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { EciHistoryPoint } from '../../types/api';

interface Props {
  data: EciHistoryPoint[];
}

export function DistrictChart({ data }: Props) {
  if (!data || data.length < 2) {
    return <div style={{ color: '#64748b', fontSize: 13 }}>Недостаточно данных для графика</div>;
  }

  const chartData = data.map((p) => ({
    t: new Date(p.calculated_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    eci: p.eci_score,
  }));

  return (
    <div style={{ height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
          <XAxis dataKey="t" stroke="#64748b" tick={{ fontSize: 11 }} />
          <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
          />
          <Line type="monotone" dataKey="eci" stroke="#38bdf8" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}