import type { GeoJSONPolygon } from '../types/api';

/**
 * GeoJSON Polygon coordinates: rings → points → [lon, lat]
 * Яндекс Polygon: [lat, lon][]
 */
export function geojsonToYandex(geojson: GeoJSONPolygon): number[][] {
  // Берём внешнее кольцо (индекс 0)
  const ring = geojson.coordinates[0] ?? [];
  return ring.map(([lon, lat]) => [lat, lon]);
}

/**
 * Центр полигона (средняя точка) для центрирования карты
 */
export function polygonCenter(coords: number[][]): [number, number] {
  if (coords.length === 0) return [54.5138, 36.2612]; // Калуга
  const sum = coords.reduce(
    (acc, [lat, lon]) => [acc[0] + lat, acc[1] + lon],
    [0, 0],
  );
  return [sum[0] / coords.length, sum[1] / coords.length];
}

export const KALUGA_CENTER: [number, number] = [54.5138, 36.2612];