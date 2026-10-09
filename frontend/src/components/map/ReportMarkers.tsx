import { Placemark } from '@pbe/react-yandex-maps';
import type { Report } from '../../types/api';
import { escapeHtml } from '../../utils/html';

const STATUS_COLOR: Record<string, string> = {
  NEW: '#3b82f6',
  IN_PROGRESS: '#fbbf24',
  RESOLVED: '#10b981',
};

interface Props {
  reports: Report[];
  reportMode: boolean;
  onPick: (point: { lat: number; lon: number }) => void;
}

export function ReportMarkers({ reports, reportMode, onPick }: Props) {
  return (
    <>
      {reports.map((r) => (
        <Placemark
          key={r.id}
          geometry={r.location}
          properties={{
            hintContent: `${escapeHtml(r.category)} · ${escapeHtml(r.status)}`,
            balloonContent: `<b>${escapeHtml(r.category)}</b><br/>${escapeHtml(r.description)}<br/>Статус: ${escapeHtml(r.status)}`,
          }}
          options={{
            preset: 'islands#circleDotIcon',
            iconColor: STATUS_COLOR[r.status] ?? '#6b7280',
            cursor: reportMode ? 'crosshair' : 'pointer',
          }}
          onClick={() => {
            if (reportMode) onPick({ lat: r.location[0], lon: r.location[1] });
          }}
        />
      ))}
    </>
  );
}