// Возвращает цвет по уровню AQI (0–100)
export function getPollutionColor(level) {
  if (level <= 30) return '#22c55e'; // хорошо
  if (level <= 50) return '#84cc16'; // умеренно
  if (level <= 65) return '#eab308'; // внимание
  if (level <= 80) return '#f97316'; // плохо
  return '#ef4444';                  // опасно
}

// Текстовый лейбл уровня
export function getPollutionLabel(level) {
  if (level <= 30) return 'Хорошо';
  if (level <= 50) return 'Умеренно';
  if (level <= 65) return 'Нездорово для чувствительных';
  if (level <= 80) return 'Нездорово';
  return 'Опасно';
}

// Цвет статуса датчика
export function getStatusColor(status) {
  return {
    good: '#22c55e',
    normal: '#3b82f6',
    warning: '#f59e0b',
    danger: '#ef4444',
  }[status] || '#6b7280';
}

export function getStatusLabel(status) {
  return {
    good: 'Норма',
    normal: 'Допустимо',
    warning: 'Внимание',
    danger: 'Опасно',
  }[status] || '—';
}