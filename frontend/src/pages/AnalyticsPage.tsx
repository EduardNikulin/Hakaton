import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import type { Dashboard } from '../types/api';

export function AnalyticsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const axisColor = isDark ? '#64748b' : '#9ca3af';
  const gridColor = isDark ? '#334155' : '#e5e7eb';

  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Dashboard>('/api/v1/analytics/dashboard').then(setData).catch(() => setError('Нет данных'));
  }, []);

  if (error) return <p style={{ color: '#ef4444' }}>{error}</p>;
  if (!data) return <p style={{ color: 'var(--text-secondary)' }}>Загрузка…</p>;

  const cards = [
    { label: 'Активные инциденты', value: String(data.active_incidents_count), color: '#f59e0b' },
    { label: 'Всего жалоб жителей', value: String(data.total_citizen_reports_count), color: '#38bdf8' },
    { label: 'Чистый район', value: data.cleanest_area.name ?? '—', color: '#22c55e' },
    { label: 'Критический район', value: data.critical_area.name ?? '—', color: '#ef4444' },
  ];

  const chartData = [
    { name: 'Чистый', score: data.cleanest_area.score ?? 0, color: '#34d399' },
    { name: 'Критический', score: data.critical_area.score ?? 0, color: '#fb7185' },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, margin: '0 0 20px' }}>Аналитика</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 24 }}>
        {cards.map((c) => (
          <div key={c.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>{c.label}</p>
            <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 600, color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Эко-индекс районов</h2>
        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke={axisColor} />
              <YAxis stroke={axisColor} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: isDark ? '#0f172a' : '#ffffff',
                  border: `1px solid ${gridColor}`,
                  borderRadius: 8,
                  color: isDark ? '#f1f5f9' : '#111827',
                }}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}