import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { EciHistoryPoint } from '../../types/api';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  data: EciHistoryPoint[];
}

export function DistrictChart({ data }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const axisColor = isDark ? '#64748b' : '#9ca3af';
  const gridColor = isDark ? '#334155' : '#e5e7eb';

  if (!data || data.length < 2) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Недостаточно данных для графика</div>;
  }

  const chartData = data.map((p) => ({
    t: new Date(p.calculated_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    eci: p.eci_score,
  }));

  return (
    <div style={{ height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
          <XAxis dataKey="t" stroke={axisColor} tick={{ fontSize: 11 }} />
          <YAxis stroke={axisColor} domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: isDark ? '#0f172a' : '#ffffff',
              border: `1px solid ${gridColor}`,
              borderRadius: 8, fontSize: 12,
              color: isDark ? '#f1f5f9' : '#111827',
            }}
          />
          <Line type="monotone" dataKey="eci" stroke="#38bdf8" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}