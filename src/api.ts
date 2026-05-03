// API Configuration
// In development: http://localhost:3000/api
// In production, use relative path or configure VITE_API_URL
// Can be overridden with VITE_API_URL environment variable
const API_URL = import.meta.env.VITE_API_URL || (() => {
  const isProduction = import.meta.env.PROD;
  if (isProduction) {
    return '/api';
  }
  return 'http://localhost:3000/api';
})();

export const api = {
  // USERS
  getUsers: async () => (await fetch(`${API_URL}/users`)).json(),
  addUser: async (data: any) => (await fetch(`${API_URL}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json(),
  updateUser: async (id: number, data: any) => fetch(`${API_URL}/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteUser: async (id: number) => fetch(`${API_URL}/users/${id}`, { method: 'DELETE' }),

  // ASSETS
  getAssets: async () => (await fetch(`${API_URL}/assets`)).json(),
  addAsset: async (data: any) => (await fetch(`${API_URL}/assets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json(),
  updateAsset: async (id: number, data: any) => fetch(`${API_URL}/assets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteAsset: async (id: number) => fetch(`${API_URL}/assets/${id}`, { method: 'DELETE' }),

  // MOVEMENTS
  getMovements: async () => (await fetch(`${API_URL}/movements`)).json(),
  addMovement: async (data: any) => (await fetch(`${API_URL}/movements`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json(),
};
