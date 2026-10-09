import { api } from './client';
import type { Report } from '../types/api';

export interface CreateReportDTO {
  category: string;
  description: string;
  location: [number, number]; // [lat, lon]
}

export function createReport(dto: CreateReportDTO): Promise<Report> {
  return api.post<Report>('/api/v1/feedback/reports', dto);
}

export function fetchReports(districtId?: number): Promise<Report[]> {
  const q = districtId ? `?district_id=${districtId}` : '';
  return api.get<Report[]>(`/api/v1/feedback/reports${q}`);
}

export function fetchMyReports(): Promise<Report[]> {
  return api.get<Report[]>('/api/v1/feedback/reports/my');
}

export function updateReport(id: number, description: string): Promise<Report> {
  return api.patch<Report>(`/api/v1/feedback/reports/${id}`, { description });
}

export function deleteReport(id: number): Promise<void> {
  return api.delete(`/api/v1/feedback/reports/${id}`);
}