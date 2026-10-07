import { getPollutionColor, getPollutionLabel } from '../utils/pollutionUtils';

export default function PollutionBadge({ level }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 999,
      fontSize: 13, fontWeight: 600, color: '#fff',
      background: getPollutionColor(level),
    }}>
      {level} — {getPollutionLabel(level)}
    </span>
  );
}