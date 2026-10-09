import { api } from './client';

export const incidentsApi = {
  getAll: (statusFilter) => {
    const url = statusFilter
      ? `/incidents?status_filter=${statusFilter}`
      : '/incidents';
    return api.get(url);
  },
  getOne: (id) => api.get(`/incidents/${id}`),
  updateStatus: (id, status, comment) =>
    api.patch(`/incidents/${id}/status`, {
      status,
      operator_comment: comment,
    }),
};