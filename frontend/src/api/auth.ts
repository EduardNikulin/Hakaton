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

export interface UserUpdateDTO {
  full_name?: string | null;
  notify_new_surveys?: boolean;
  notify_results?: boolean;
  notify_pollution?: boolean;
}

export function updateMe(dto: UserUpdateDTO): Promise<CurrentUser> {
  return api.patch<CurrentUser>('/api/v1/auth/me', dto);
}

export function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<{ status: string; message: string }> {
  return api.post('/api/v1/auth/me/password', {
    old_password: oldPassword,
    new_password: newPassword,
  });
}