import { api } from './client';

export const feedbackApi = {
  createReport: (payload) => api.post('/feedback/reports', payload),
  getMyReports: () => api.get('/feedback/reports/my'),
  getAllReports: () => api.get('/feedback/reports'),
};