import { api, setToken, clearToken } from './client';
import type { Token, CurrentUser } from '../types/api';

export async function login(email: string, password: string): Promise<void> {
  const form = new URLSearchParams({ username: email, password });
  const token = await api.postForm<Token>('/api/v1/auth/login', form);
  setToken(token.access_token);
}

export async function register(email: string, password: string): Promise<void> {
  const token = await api.post<Token>('/api/v1/auth/register', { email, password });
  setToken(token.access_token);
}

export async function fetchMe(): Promise<CurrentUser> {
  return api.get<CurrentUser>('/api/v1/auth/me');
}

export function logout(): void {
  clearToken();
}