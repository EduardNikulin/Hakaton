import { api } from './client';

const TOKEN_KEY = 'token'; // ← тот же ключ, что в client.js

export const authApi = {
  async login(email, password) {
    // OAuth2 password flow — form-urlencoded, не JSON
    const body = new URLSearchParams();
    body.append('username', email);
    body.append('password', password);

    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) throw new Error('Неверный email или пароль');

    const data = await res.json();
    // Формат: { access_token, token_type }
    localStorage.setItem(TOKEN_KEY, data.access_token);
    return data;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  async me() {
    return api.get('/auth/me');
  },
};