import { api } from './client';
import type { District, EciStats } from '../types/api';

export function fetchDistricts(): Promise<District[]> {
  return api.get<District[]>('/api/v1/maps/districts');
}

export function fetchDistrictStats(id: number): Promise<EciStats> {
  return api.get<EciStats>(`/api/v1/maps/districts/${id}/stats`);
}

// Патч F1: история ECI для графика (добавим на бэке)
export function fetchDistrictHistory(id: number) {
  return api.get<{ calculated_at: string; eci_score: number }[]>(
    `/api/v1/maps/districts/${id}/history`,
  );
}