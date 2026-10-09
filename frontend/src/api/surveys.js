import { api } from './client';

export const surveysApi = {
  getAll: () => api.get('/feedback/surveys'),
  submitAnswers: (id, payload) => api.post(`/feedback/surveys/${id}/answers`, payload),
};