// API Configuration
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Helper para manejar errores correctamente
const request = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);

  const contentType = res.headers.get('content-type');

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('La respuesta no es JSON');
  }

  return res.json();
};

export const api = {
  // --- USERS ---
  getUsers: async () =>
    request(`${API_URL}/users`),

  addUser: async (data: any) =>
    request(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // 🔥 CAMBIO IMPORTANTE (ya no va /:id)
  updateUser: async (id: number, data: any) =>
    request(`${API_URL}/users`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    }),

  // 🔥 CAMBIO IMPORTANTE (query param)
  deleteUser: async (id: number) =>
    request(`${API_URL}/users?id=${id}`, {
      method: 'DELETE',
    }),

  // --- ASSETS ---
  getAssets: async () =>
    request(`${API_URL}/assets`),

  addAsset: async (data: any) =>
    request(`${API_URL}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  updateAsset: async (id: number, data: any) =>
    request(`${API_URL}/assets`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    }),

  deleteAsset: async (id: number) =>
    request(`${API_URL}/assets?id=${id}`, {
      method: 'DELETE',
    }),

  // --- MOVEMENTS ---
  getMovements: async () =>
    request(`${API_URL}/movements`),

  addMovement: async (data: any) =>
    request(`${API_URL}/movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
};
