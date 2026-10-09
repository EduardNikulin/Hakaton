import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import {
  fetchActiveSurveys, updateSurveyActive, deleteSurvey, type Survey,
} from '../api/surveys';
import { useAuth } from '../context/AuthContext';
import { hasAnyRole } from '../utils/roles';

export function SurveysPage() {
  const { role, user } = useAuth();
  const canManage = hasAnyRole(role, ['author', 'admin']);
  const canManageSurvey = (s: Survey) => hasAnyRole(role, ['admin']) || s.created_by === user?.id;

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    fetchActiveSurveys()
      .then((data) => { setSurveys(data); setError(''); })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleFinish = async (s: Survey) => {
    if (!confirm(`Завершить опрос «${s.title}»?`)) return;
    try { await updateSurveyActive(s.id, false); load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const handleDelete = async (s: Survey) => {
    if (!confirm(`Удалить опрос «${s.title}»?`)) return;
    try { await deleteSurvey(s.id); load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Ошибка удаления'); }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>📋 Опросы</h1>
        {canManage && (
          <Link to="/surveys/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 10, background: '#22c55e', color: '#fff',
            textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            <Plus size={16} /> Создать опрос
          </Link>
        )}
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
        Участвуйте в опросах и помогайте улучшить экологию города
      </p>

      {loading && <div style={{ color: 'var(--text-muted)' }}>Загрузка…</div>}
      {error && <div style={{ color: '#ef4444', marginBottom: 16 }}>{error}</div>}

      {!loading && !error && surveys.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)',
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16 }}>
          Активных опросов пока нет
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {surveys.map((s) => (
          <article key={s.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{s.title}</h3>
                {s.description && (
                  <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {s.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <ClipboardList size={14} /> {s.questions.length} вопр.
                  </span>
                  <span>🕒 {new Date(s.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
              <Link to={`/surveys/${s.id}`} style={{ flexShrink: 0, padding: '9px 18px', borderRadius: 10,
                background: '#22c55e', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                Пройти
              </Link>
            </div>

            {canManage && (
              <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <button onClick={() => handleFinish(s)}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>
                  Завершить
                </button>
                <button onClick={() => handleDelete(s)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                    borderRadius: 8, border: '1px solid #7f1d1d', background: 'transparent',
                    color: '#fca5a5', cursor: 'pointer', fontSize: 13 }}>
                  <Trash2 size={14} /> Удалить
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}