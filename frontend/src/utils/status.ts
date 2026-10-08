// Единая нормализация статусов инцидентов.
// Бэкенд создаёт инциденты со статусом CRITICAL/WARNING (детектор / seed),
// оператор переводит их в IN_PROGRESS/RESOLVED. Для UI все "открытые"
// статусы сводим к OPEN, чтобы фильтры и бейджи работали единообразно.
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

const OPEN_ALIASES = ['CRITICAL', 'WARNING', 'OPEN', 'NEW'];

export function normalizeIncidentStatus(status: string | null | undefined): IncidentStatus {
  const s = (status ?? '').toUpperCase();
  if (s === 'RESOLVED') return 'RESOLVED';
  if (s === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (OPEN_ALIASES.includes(s)) return 'OPEN';
  return 'OPEN';
}

export const INCIDENT_STATUS_META: Record<
  IncidentStatus,
  { label: string; color: string; bg: string }
> = {
  OPEN: { label: 'Открыт', color: '#f87171', bg: '#7f1d1d' },
  IN_PROGRESS: { label: 'В работе', color: '#fbbf24', bg: '#78350f' },
  RESOLVED: { label: 'Решён', color: '#34d399', bg: '#064e3b' },
};