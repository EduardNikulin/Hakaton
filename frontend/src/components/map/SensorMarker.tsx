import { Placemark } from '@pbe/react-yandex-maps';
import type { Sensor } from '../../types/api';

// Цвет по типу датчика (не пересекается с палитрой ECI/жалоб).
// air → индиго, water → циан.
const TYPE_COLOR: Record<string, string> = {
  air: '#6366f1',
  water: '#06b6d4',
};

const TYPE_LABEL: Record<string, string> = {
  air: 'Воздух',
  water: 'Вода',
};

interface Props {
  sensors: Sensor[];
  reportMode: boolean;
  onPick: (point: { lat: number; lon: number }) => void;
  districtNames?: Record<number, string>;
}

export function SensorMarkers({ sensors, reportMode, onPick, districtNames = {} }: Props) {
  return (
    <>
      {sensors.map((s) => {
        // Бэк отдаёт location как [lat, lon] (computed_field SensorSchema)
        const [lat, lon] = s.location;
        const typeLabel = TYPE_LABEL[s.sensor_type] ?? s.sensor_type;
        const district = s.district_id != null ? districtNames[s.district_id] : undefined;
        return (
          <Placemark
            key={`sensor-${s.id}`}
            geometry={[lat, lon]}
            properties={{
              hintContent: `${s.name} · ${typeLabel}`,
              balloonContent: `
                <b>${s.name}</b><br/>
                Тип: ${typeLabel}<br/>
                Статус: ${s.status}${district ? `<br/>Район: ${district}` : ''}
              `,
            }}
            options={{
              preset: 'islands#circleIcon',
              iconColor: TYPE_COLOR[s.sensor_type] ?? '#64748b',
              cursor: reportMode ? 'crosshair' : 'pointer',
            }}
            onClick={() => {
              if (reportMode) onPick({ lat, lon });
            }}
          />
        );
      })}
    </>
  );
}