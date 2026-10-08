import { useEffect, useState } from 'react';
import { reportsApi } from '../api';
import type { Report } from '../types/api';
import { Link } from 'react-router-dom';

const STATUS_LABEL: Record<string, string> = {
  NEW: 'Новая', IN_PROGRESS: 'В работе', RESOLVED: 'Решена',
};
const STATUS_COLOR: Record<string, string> = {
  NEW: '#3b82f6', IN_PROGRESS: '#fbbf24', RESOLVED: '#10b981',
};

export function MyReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const load = () => {
    reportsApi.fetchMyReports()
      .then((data) => setReports([...data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )))
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить жалобу?')) return;
    try { await reportsApi.deleteReport(id); load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Ошибка удаления'); }
  };

  const handleSave = async (id: number) => {
    try { await reportsApi.updateReport(id, editText.trim()); setEditingId(null); load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Ошибка сохранения'); }
  };

  if (loading) return <div style={{ color: '#94a3b8', padding: 40 }}>Загрузка…</div>;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#f1f5f9', margin: 0 }}>Мои жалобы</h2>
        <Link to="/" style={{ color: '#22c55e', fontSize: 14, textDecoration: 'none' }}>
          ← На карту
        </Link>
      </div>
      {error && <div style={{ color: '#ef4444', marginBottom: 16 }}>{error}</div>}
      {reports.length === 0 && (
        <div style={{ color: '#64748b', padding: 40, textAlign: 'center' }}>
          Жалоб пока нет. Отметьте проблему на карте!
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {reports.map((r) => (
          <div key={r.id} style={{ background: '#1e293b', borderRadius: 12, padding: 16, color: '#f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 700 }}>{r.category}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLOR[r.status] ?? '#94a3b8' }}>
                {STATUS_LABEL[r.status] ?? r.status}
              </span>
            </div>
            {editingId === r.id ? (
              <div>
                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #334155',
                    background: '#0f172a', color: '#f1f5f9', boxSizing: 'border-box', marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleSave(r.id)}
                    style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer' }}>
                    Сохранить
                  </button>
                  <button onClick={() => setEditingId(null)}
                    style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 14, color: '#cbd5e1', marginBottom: 8 }}>{r.description}</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748b' }}>
              <span>
                📍 {r.location[0].toFixed(4)}, {r.location[1].toFixed(4)}
                {' · '}{new Date(r.created_at).toLocaleString('ru-RU')}
              </span>
              {editingId !== r.id && (
                <span style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setEditingId(r.id); setEditText(r.description); }}
                    style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>
                    Ред.
                  </button>
                  <button onClick={() => handleDelete(r.id)}
                    style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #7f1d1d', background: 'transparent', color: '#fca5a5', cursor: 'pointer', fontSize: 12 }}>
                    Удалить
                  </button>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}