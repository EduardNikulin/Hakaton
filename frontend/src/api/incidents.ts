import { api } from './client';
import type { Incident } from '../types/api';

export function fetchIncidents(statusFilter?: string): Promise<Incident[]> {
  const q = statusFilter ? `?status_filter=${statusFilter}` : '';
  return api.get<Incident[]>(`/api/v1/incidents${q}`);
}

export function fetchIncident(id: number): Promise<Incident> {
  return api.get<Incident>(`/api/v1/incidents/${id}`);
}

export function updateIncidentStatus(
  id: number,
  status: string,
  operatorComment?: string,
): Promise<Incident> {
  return api.patch<Incident>(`/api/v1/incidents/${id}/status`, {
    status,
    operator_comment: operatorComment ?? null,
  });
}

export function fetchIncidentTimeline(id: number) {
  return api.get<{ time: string; event: string; type: string }[]>(
    `/api/v1/incidents/${id}/timeline`,
  );
}