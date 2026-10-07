import { useState } from 'react';
import { X, MapPin, Camera } from 'lucide-react';

const CATEGORIES = [
  { value: 'smell',     label: 'Запах'  },
  { value: 'trash',     label: 'Мусор'  },
  { value: 'discharge', label: 'Сливы'  },
  { value: 'noise',     label: 'Шум'    },
  { value: 'other',     label: 'Другое' },
];

export default function ReportModal({ point, onClose, onSubmit }) {
  const [category, setCategory] = useState('smell');
  const [text, setText] = useState('');
  const [photoName, setPhotoName] = useState(null);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit({
      category: CATEGORIES.find(c => c.value === category).label,
      text,
      coords: [point.lat, point.lon],
      photoName,
    });
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
            placeholder="Опишите проблему: что, где, когда..."
            rows={4}
            style={{
              width: '100%', padding: 12, borderRadius: 10,
              border: '1px solid #e5e7eb', fontSize: 14, resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
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

        {/* Кнопки */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: 'white', color: '#374151', border: '1px solid #e5e7eb', cursor: 'pointer',
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: text.trim() ? '#22c55e' : '#d1d5db',
              color: 'white', border: 'none',
              cursor: text.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
}