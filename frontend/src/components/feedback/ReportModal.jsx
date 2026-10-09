import { useState } from 'react';
import { X, MapPin, Camera } from 'lucide-react';

const CATEGORIES = [
  { value: 'smell',     label: 'Запах'  },
  { value: 'trash',     label: 'Мусор'  },
  { value: 'discharge', label: 'Сливы'  },
  { value: 'noise',     label: 'Шум'    },
  { value: 'other',     label: 'Другое' },
];

const MIN_LENGTH = 5;

export default function ReportModal({ point, onClose, onSubmit }) {
  const [category, setCategory] = useState('smell');
  const [text, setText] = useState('');
  const [photoName, setPhotoName] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const trimmedLength = text.trim().length;
  const isValid = trimmedLength >= MIN_LENGTH;
  const remaining = MIN_LENGTH - trimmedLength;

  const handleSubmit = async () => {
    if (!isValid) {
      setError(`Описание должно быть минимум ${MIN_LENGTH} символов`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        category: CATEGORIES.find(c => c.value === category).label,
        text,
        coords: [point.lat, point.lon],
        photoName,
      });
    } catch (err) {
      setError(err.message || 'Не удалось отправить жалобу');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white', borderRadius: 20, width: 440, maxWidth: '90vw',
          padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.3)',
          fontFamily: 'system-ui, sans-serif',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Сообщить о проблеме</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 13, color: '#6b7280' }}>
              <MapPin size={14} />
              {point.lat.toFixed(5)}, {point.lon.toFixed(5)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Категория */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#374151' }}>Категория</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                style={{
                  padding: '8px 14px', borderRadius: 10, fontSize: 13,
                  border: category === c.value ? '2px solid #22c55e' : '1px solid #e5e7eb',
                  background: category === c.value ? '#f0fdf4' : 'white',
                  color: category === c.value ? '#16a34a' : '#374151',
                  cursor: 'pointer', fontWeight: 500,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Описание */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#374151' }}>Описание</div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Опишите проблему подробнее (минимум ${MIN_LENGTH} символов)...`}
            rows={4}
            style={{
              width: '100%', padding: 12, borderRadius: 10,
              border: `1px solid ${trimmedLength > 0 && !isValid ? '#fca5a5' : '#e5e7eb'}`,
              fontSize: 14, resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
          <div style={{
            fontSize: 11,
            marginTop: 6,
            textAlign: 'right',
            color: trimmedLength === 0 ? '#9ca3af' : (isValid ? '#22c55e' : '#ef4444'),
          }}>
            {trimmedLength === 0
              ? `минимум ${MIN_LENGTH} символов`
              : isValid
                ? `${trimmedLength} символов ✓`
                : `Ещё ${remaining} ${remaining === 1 ? 'символ' : remaining < 5 ? 'символа' : 'символов'}`}
          </div>
        </div>

        {/* Фото (без реальной загрузки) */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 10,
            border: '1px dashed #d1d5db', cursor: 'pointer',
            fontSize: 13, color: '#6b7280',
          }}>
            <Camera size={16} />
            {photoName || 'Прикрепить фото'}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => setPhotoName(e.target.files?.[0]?.name ?? null)}
            />
          </label>
        </div>

        {/* Ошибка */}
        {error && (
          <div style={{
            background: '#fee2e2', color: '#dc2626',
            padding: 10, borderRadius: 10, fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Кнопки */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: 'white', color: '#374151', border: '1px solid #e5e7eb',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: isValid && !submitting ? '#22c55e' : '#d1d5db',
              color: 'white', border: 'none',
              cursor: isValid && !submitting ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? 'Отправляем...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
}