import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsApi, ApiError } from '../../api';

const CATEGORIES = ['Запах', 'Мусор', 'Сливы', 'Шум', 'Другое'];

interface Props {
  point: { lat: number; lon: number };
  onClose: () => void;
  onCreated: () => void;
}

export function ReportModal({ point, onClose, onCreated }: Props) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (text.trim().length < 5) {
      setError('Опишите проблему подробнее (минимум 5 символов)');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await reportsApi.createReport({
        category,
        description: text.trim(),
        location: [point.lat, point.lon],
      });
      onCreated();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError('Нужно войти, чтобы отправить жалобу');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        setError(e instanceof Error ? e.message : 'Ошибка отправки');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: '#1e293b', borderRadius: 16, width: 440, maxWidth: '92vw',
          padding: 24, color: '#f1f5f9' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 19 }}>Сообщить о проблеме</h2>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
          📍 {point.lat.toFixed(5)}, {point.lon.toFixed(5)}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                border: category === c ? '1px solid #22c55e' : '1px solid #334155',
                background: category === c ? '#14532d' : 'transparent',
                color: category === c ? '#86efac' : '#94a3b8' }}>
              {c}
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Что, где, когда..."
          rows={4}
          style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #334155',
            background: '#0f172a', color: '#f1f5f9', resize: 'vertical',
            fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12 }}
        />

        {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #334155',
              background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
            Отмена
          </button>
          <button onClick={handleSubmit} disabled={loading || !text.trim()}
            style={{ padding: '10px 18px', borderRadius: 8, border: 'none',
              background: loading || !text.trim() ? '#475569' : '#22c55e',
              color: '#fff', fontWeight: 600,
              cursor: loading || !text.trim() ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
}