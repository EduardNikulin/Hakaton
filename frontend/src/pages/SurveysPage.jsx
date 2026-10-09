import { useState, useEffect } from 'react';
import Header from '../components/Header';
import SurveyCard from '../components/SurveyCard';
import { surveysApi } from '../api/surveys';

export default function SurveysPage() {
  const [filter, setFilter] = useState('all');
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    surveysApi.getAll()
      .then((data) => {
        setSurveys(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filtered = surveys.filter((s) => {
    if (filter === 'active') return s.is_active;
    if (filter === 'completed') return !s.is_active;
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', transition: 'background .3s' }}>
      <Header />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>
          📋 Опросы
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 15 }}>
          Участвуйте в опросах и помогайте улучшить экологию города
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            { key: 'all', label: 'Все' },
            { key: 'active', label: 'Активные' },
            { key: 'completed', label: 'Завершённые' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 14, transition: 'all .2s',
                background: filter === f.key ? '#22c55e' : 'var(--bg-secondary)',
                color: filter === f.key ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            Загрузка опросов...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#ef4444', background: 'var(--bg-card)', borderRadius: 16 }}>
            Ошибка: {error}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: 40, color: 'var(--text-muted)',
                background: 'var(--bg-card)', borderRadius: 16,
                border: '1px solid var(--border)',
              }}>
                Нет опросов в этой категории
              </div>
            ) : (
              filtered.map((survey) => <SurveyCard key={survey.id} survey={survey} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}