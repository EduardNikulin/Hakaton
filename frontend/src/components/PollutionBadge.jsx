// ECI от бэка: ВЫШЕ = ЛУЧШЕ
function getEciColor(score) {
  if (score >= 75) return '#22c55e'; // хорошо
  if (score >= 50) return '#f59e0b'; // средне
  return '#ef4444';                  // плохо
}

function getEciLabel(score) {
  if (score >= 75) return 'Хорошо';
  if (score >= 50) return 'Средне';
  return 'Плохо';
}

export default function PollutionBadge({ level }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 999,
      fontSize: 13, fontWeight: 600, color: '#fff',
      background: getEciColor(level),
    }}>
      {level} — {getEciLabel(level)}
    </span>
  );
}