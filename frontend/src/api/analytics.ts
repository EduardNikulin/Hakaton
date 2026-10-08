import { api } from './client';
import type { Dashboard } from '../types/api';

export function fetchDashboard(): Promise<Dashboard> {
  return api.get<Dashboard>('/api/v1/analytics/dashboard');
}

export function fetchCorrelations() {
  return api.get('/api/v1/analytics/correlations');
}

export function recalculateEci() {
  return api.post('/api/v1/analytics/recalculate');
}