const BASE = '/api/v1';

export const api = {
  async get(url) {
    const token = localStorage.getItem('token');
    const res = await fetch(BASE + url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${url}`);
    return res.json();
  },

  async post(url, body) {
    const token = localStorage.getItem('token');
    const res = await fetch(BASE + url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${url}`);
    return res.json();
  },
};