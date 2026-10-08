import { api } from './client';
import type { District, EciStats, EciHistoryPoint } from '../types/api';

export function fetchDistricts(): Promise<District[]> {
  return api.get<District[]>('/api/v1/maps/districts');
}

export function fetchDistrictStats(id: number): Promise<EciStats> {
  return api.get<EciStats>(`/api/v1/maps/districts/${id}/stats`);
}

// История ECI района для графика динамики (эндпоинт реализован: GET /maps/districts/{id}/history)
export function fetchDistrictHistory(id: number): Promise<EciHistoryPoint[]> {
  return api.get<EciHistoryPoint[]>(`/api/v1/maps/districts/${id}/history`);
}