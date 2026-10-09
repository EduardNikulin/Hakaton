import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import Header from '../components/Header';
import { incidentsApi } from '../api/incidents';
import { useAuth } from '../hooks/useAuth';

const STATUS_LABELS = {
  NEW:         { label: 'Новый',      color: '#3b82f6', icon: Clock },
  WARNING:     { label: 'Внимание',   color: '#fbbf24', icon: AlertTriangle },
  CRITICAL:    { label: 'Критично',   color: '#ef4444', icon: AlertTriangle },
  IN_PROGRESS: { label: 'В работе',   color: '#f97316', icon: Clock },
  RESOLVED:    { label: 'Решён',      color: '#22c55e', icon: CheckCircle },
  REJECTED:    { label: 'Отклонён',   color: '#6b7280', icon: XCircle },
};

const FILTERS = [
  { key: 'all',         label: 'Все' },
  { key: 'CRITICAL',    label: 'Критичные' },
  { key: 'WARNING',     label: 'Внимание' },
  { key: 'IN_PROGRESS', label: 'В работе' },
  { key: 'RESOLVED',    label: 'Решённые' },
];

export default function OperatorPage() {
  const navigate = useNavigate();
  const { isAuthenticated, role, loading: authLoading } = useAuth();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  // Только admin может сюда
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    if (role !== 'admin') { navigate('/'); return; }

    incidentsApi.getAll()
      .then((data) => {
        setIncidents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [isAuthenticated, role, authLoading, navigate]);

  const handleStatusChange = async (incidentId, newStatus) => {
    setSaving(true);
    try {
      await incidentsApi.updateStatus(incidentId, newStatus, comment);
      setIncidents((prev) =>
        prev.map((i) =>
          i.id === incidentId
            ? { ...i, status: newStatus, operator_comment: comment }
            : i
        )
      );
      setSelected(null);
      setComment('');
    } catch (err) {
      alert('Не удалось обновить: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const openDetails = (inc) => {
    setSelected(inc);
    setComment(inc.operator_comment ?? '');
  };

  const filtered = filter === 'all'
    ? incidents
    : incidents.filter((i) => i.status === filter);

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <div style={{
          minHeight: 'calc(100vh - 64px)', background: 'var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}>
          Загрузка...
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--bg)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          <h1 style={{
            fontSize: 28, fontWeight: 800, marginBottom: 8,
            color: 'var(--text-primary)',
          }}>
            🚨 Панель инцидентов
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Управляйте жизненным циклом экологических инцидентов
          </p>

          {/* Фильтры */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '8px 18px', borderRadius: 10, fontSize: 13,
                  fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: filter === f.key ? '#22c55e' : 'var(--bg-secondary)',
                  color: filter === f.key ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {f.label}
                {f.key !== 'all' && (
                  <span style={{ marginLeft: 6, opacity: 0.7 }}>
                    {incidents.filter((i) => i.status === f.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {error ? (
            <div style={{
              padding: 40, textAlign: 'center', color: '#ef4444',
              background: 'var(--bg-card)', borderRadius: 16,
            }}>
              Ошибка: {error}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              padding: 40, textAlign: 'center', color: 'var(--text-muted)',
              background: 'var(--bg-card)', borderRadius: 16,
              border: '1px solid var(--border)',
            }}>
              {filter === 'all' ? 'Инцидентов пока нет' : 'Нет инцидентов с таким статусом'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((inc) => {
                const st = STATUS_LABELS[inc.status] ?? STATUS_LABELS.NEW;
                const Icon = st.icon;
                return (
                  <div
                    key={inc.id}
                    onClick={() => openDetails(inc)}
                    style={{
                      background: 'var(--bg-card)', borderRadius: 16, padding: 20,
                      border: '1px solid var(--border)', cursor: 'pointer',
                      transition: 'border-color .2s, transform .15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = st.color;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {inc.title}
                        </h3>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          <span>Район #{inc.district_id}</span>
                          {inc.confidence_rate != null && (
                            <span>Точность: {inc.confidence_rate}%</span>
                          )}
                          {inc.created_at && (
                            <span>{new Date(inc.created_at).toLocaleString('ru-RU')}</span>
                          )}
                        </div>
                        {inc.operator_comment && (
                          <div style={{
                            marginTop: 10, padding: '8px 12px',
                            background: 'var(--bg-secondary)', borderRadius: 8,
                            fontSize: 12, color: 'var(--text-secondary)',
                            borderLeft: `3px solid ${st.color}`,
                          }}>
                            💬 {inc.operator_comment}
                          </div>
                        )}
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 14px', borderRadius: 10,
                        background: st.color + '20', color: st.color,
                        fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}>
                        <Icon size={14} /> {st.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Модалка деталей */}
      {selected && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15,23,42,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              background: 'var(--bg-card)', borderRadius: 20,
              width: 520, maxWidth: '90vw', padding: 28,
              maxHeight: '90vh', overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              margin: 0, fontSize: 20,
              color: 'var(--text-primary)', marginBottom: 12,
            }}>
              {selected.title}
            </h2>

            <div style={{
              fontSize: 13, color: 'var(--text-secondary)',
              marginBottom: 20, lineHeight: 1.7,
            }}>
              <div>Статус: <b>{STATUS_LABELS[selected.status]?.label ?? selected.status}</b></div>
              <div>Район ID: {selected.district_id}</div>
              {selected.confidence_rate != null && (
                <div>Точность: {selected.confidence_rate}%</div>
              )}
              {selected.created_at && (
                <div>Создан: {new Date(selected.created_at).toLocaleString('ru-RU')}</div>
              )}
            </div>

            <label style={{
              display: 'block', fontSize: 13, fontWeight: 600,
              color: 'var(--text-primary)', marginBottom: 8,
            }}>
              Комментарий оператора
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Что делаем с инцидентом..."
              rows={3}
              style={{
                width: '100%', padding: 12, borderRadius: 10,
                border: '1px solid var(--border)', fontSize: 13,
                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                fontFamily: 'inherit', boxSizing: 'border-box',
                marginBottom: 20, resize: 'vertical',
              }}
            />

            <div style={{
              fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
              letterSpacing: '0.05em', marginBottom: 10,
            }}>
              СМЕНИТЬ СТАТУС
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {['IN_PROGRESS', 'RESOLVED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(selected.id, st)}
                  disabled={saving || selected.status === st}
                  style={{
                    padding: '10px 18px', borderRadius: 10, fontSize: 13,
                    border: 'none',
                    cursor: saving || selected.status === st ? 'not-allowed' : 'pointer',
                    background: STATUS_LABELS[st].color,
                    color: 'white', fontWeight: 600,
                    opacity: saving || selected.status === st ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {STATUS_LABELS[st].label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelected(null)}
              style={{
                padding: '10px 20px', borderRadius: 10, fontSize: 13,
                background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                border: '1px solid var(--border)', cursor: 'pointer',
                width: '100%',
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}