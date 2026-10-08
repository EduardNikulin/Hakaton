import { Placemark } from '@pbe/react-yandex-maps';
import type { Incident, District } from '../../types/api';
import { geojsonToYandex, polygonCenter } from '../../utils/geo';
import { normalizeIncidentStatus } from '../../utils/status';

interface Props {
  incidents: Incident[];
  districts: District[];
  reportMode: boolean;
  onPick: (point: { lat: number; lon: number }) => void;
}

export function IncidentMarkers({ incidents, districts, reportMode, onPick }: Props) {
  // Активные (не решённые) инциденты, сгруппированные по району.
  // НЕ используем JS Map — чтобы не путаться с компонентом карты, работаем через объект.
  const districtById: Record<number, District> = {};
  districts.forEach((d) => { districtById[d.id] = d; });

  const grouped: Record<number, Incident[]> = {};
  incidents
    .filter((i) => normalizeIncidentStatus(i.status) !== 'RESOLVED')
    .forEach((inc) => {
      if (!grouped[inc.district_id]) grouped[inc.district_id] = [];
      grouped[inc.district_id].push(inc);
    });

  return (
    <>
      {Object.keys(grouped).map((key) => {
        const districtId = Number(key);
        const district = districtById[districtId];
        if (!district) return null;
        const center = polygonCenter(geojsonToYandex(district.polygon_geojson));
        const list = grouped[districtId];
        const titles = list.map((i) => `• ${i.title}`).join('<br/>');
        return (
          <Placemark
            key={`incident-${districtId}`}
            geometry={center}
            properties={{
              hintContent: `🚨 Инцидентов: ${list.length} · ${district.name}`,
              balloonContent: `<b>🚨 ${district.name}</b><br/>${titles}`,
            }}
            options={{
              preset: 'islands#redIcon',
              iconColor: '#ef4444',
              cursor: reportMode ? 'crosshair' : 'pointer',
            }}
            onClick={() => {
              if (reportMode) onPick({ lat: center[0], lon: center[1] });
            }}
          />
        );
      })}
    </>
  );
}