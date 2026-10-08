import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { api } from '../api/client';
import type { Dashboard } from '../types/api';

export function AnalyticsPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Dashboard>('/api/v1/analytics/dashboard').then(setData).catch(() => setError('Нет данных'));
  }, []);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!data) return <p className="text-slate-400">Загрузка…</p>;

  const cards = [
    { label: 'Активные инциденты', value: String(data.active_incidents_count), color: 'text-amber-400' },
    { label: 'Всего жалоб жителей', value: String(data.total_citizen_reports_count), color: 'text-sky-400' },
    { label: 'Чистый район', value: data.cleanest_area.name ?? '—', color: 'text-emerald-400' },
    { label: 'Критический район', value: data.critical_area.name ?? '—', color: 'text-rose-400' },
  ];

  const chartData = [
    { name: 'Чистый', score: data.cleanest_area.score ?? 0, color: '#34d399' },
    { name: 'Критический', score: data.critical_area.score ?? 0, color: '#fb7185' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Аналитика</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-slate-800 p-4">
            <p className="text-sm text-slate-400">{c.label}</p>
            <p className={`mt-1 text-xl font-semibold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-slate-800 p-4">
        <h2 className="mb-4 font-semibold">Эко-индекс районов</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
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