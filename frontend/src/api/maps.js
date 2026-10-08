import { api } from './client';

export const fetchDistricts = () => api.get('/maps/districts');
export const fetchSensors   = () => api.get('/sensors');
export const fetchReports   = () => api.get('/feedback/reports');
export const fetchIncidents = () => api.get('/incidents');
export const fetchSensorHistory = (id) => api.get(`/sensors/${id}/history`);