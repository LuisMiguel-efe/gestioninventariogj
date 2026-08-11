// API Configuration
const API_URL = import.meta.env.VITE_API_URL || '/api';

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
  // ─── DEPARTAMENTOS ────────────────────────────────────────────────────────
  getDepartamentos: () => request(`${API_URL}/departamentos`),
  addDepartamento: (data: { nombre: string }) =>
    request(`${API_URL}/departamentos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateDepartamento: (id: number, data: { nombre: string }) =>
    request(`${API_URL}/departamentos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteDepartamento: (id: number) =>
    request(`${API_URL}/departamentos/${id}`, { method: 'DELETE' }),

  // ─── USUARIOS ─────────────────────────────────────────────────────────────
  getUsers: () => request(`${API_URL}/users`),
  addUser: (data: any) =>
    request(`${API_URL}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) =>
    request(`${API_URL}/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteUser: (id: string) =>
    request(`${API_URL}/users/${id}`, { method: 'DELETE' }),

  // ─── ACTIVOS ──────────────────────────────────────────────────────────────
  getAssets: (filters?: { tipo?: string; disponibilidad?: string }) => {
    const params = new URLSearchParams();
    if (filters?.tipo) params.set('tipo', filters.tipo);
    if (filters?.disponibilidad) params.set('disponibilidad', filters.disponibilidad);
    const qs = params.toString();
    return request(`${API_URL}/assets${qs ? `?${qs}` : ''}`);
  },
  addAsset: (data: any) =>
    request(`${API_URL}/assets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateAsset: (id: number, data: any) =>
    request(`${API_URL}/assets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteAsset: (id: number) =>
    request(`${API_URL}/assets/${id}`, { method: 'DELETE' }),

   // ─── HERRAMIENTAS ─────────────────────────────────────────────────────────
  getHerramientas: (filters?: { categoria?: string; disponibilidad?: string }) => {
    const params = new URLSearchParams();
    if (filters?.categoria) params.set('categoria', filters.categoria);
    if (filters?.disponibilidad) params.set('disponibilidad', filters.disponibilidad);
    const qs = params.toString();
    return request(`${API_URL}/herramientas${qs ? `?${qs}` : ''}`);
  },
  addHerramienta: (data: any) =>
    request(`${API_URL}/herramientas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateHerramienta: (id: number, data: any) =>
    request(`${API_URL}/herramientas/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteHerramienta: (id: number) =>
    request(`${API_URL}/herramientas/${id}`, { method: 'DELETE' }),
  
  // ─── MOVIMIENTOS ──────────────────────────────────────────────────────────
  getMovements: (filters?: { assetId?: number; userId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.assetId) params.set('assetId', String(filters.assetId));
    if (filters?.userId) params.set('userId', filters.userId);
    const qs = params.toString();
    return request(`${API_URL}/movements${qs ? `?${qs}` : ''}`);
  },
  addMovement: (data: any) =>
    request(`${API_URL}/movements`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),

   // ─── MOVIMIENTOS DE HERRAMIENTAS ────────────────────────────────────────────
  getHerramientaMovements: (filters?: { herramientaId?: number; userId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.herramientaId) params.set('herramientaId', String(filters.herramientaId));
    if (filters?.userId) params.set('userId', filters.userId);
    const qs = params.toString();
    return request(`${API_URL}/herramienta-movements${qs ? `?${qs}` : ''}`);
  },
  addHerramientaMovement: (data: any) =>
    request(`${API_URL}/herramienta-movements`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
 
  // ─── LÍNEAS MÓVILES ───────────────────────────────────────────────────────
  getPhoneLines: () => request(`${API_URL}/phonelines`),
  addPhoneLine: (data: any) =>
    request(`${API_URL}/phonelines`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updatePhoneLine: (id: number, data: any) =>
    request(`${API_URL}/phonelines/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deletePhoneLine: (id: number) =>
    request(`${API_URL}/phonelines/${id}`, { method: 'DELETE' }),
};
