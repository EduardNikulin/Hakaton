import { api } from './client';
import type { Sensor, Measurement } from '../types/api';

export function fetchSensors(): Promise<Sensor[]> {
  return api.get<Sensor[]>('/api/v1/sensors');
}

export function fetchSensorHistory(sensorId: number): Promise<Measurement[]> {
  return api.get<Measurement[]>(`/api/v1/sensors/${sensorId}/history`);
}