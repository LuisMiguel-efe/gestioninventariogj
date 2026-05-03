import Dexie, { type EntityTable } from 'dexie';

export interface User {
  id?: string;
  nombre: string;
  email: string;
  rol: 'administrador' | 'empleado';
  departamento: string;
  activo: boolean;
}

export interface Asset {
  id?: number;
  codigo: string;
  tipo: 'laptop' | 'desktop' | 'impresora' | 'accesorio';
  marca: string;
  modelo: string;
  estado: 'activo' | 'inactivo';
  disponibilidad: 'asignado' | 'disponible' | 'en reparacion';
  ubicacion: string;
  propietarioId?: string; // Referencia a User, opcional si está disponible
  fechaAdquisicion?: string;
  notas?: string;
}

export interface Movement {
  id?: number;
  assetId: number;
  userId: string; // usuario destino (el que recibe o entrega)
  registradoPorId: string; // el admin que registró en el sistema
  tipo: 'asignacion' | 'devolucion' | 'reparacion' | 'cambio';
  fecha: string;
  notas?: string;
}

const db = new Dexie('InventarioGJDatabase') as Dexie & {
  users: EntityTable<User, 'id'>;
  assets: EntityTable<Asset, 'id'>;
  movements: EntityTable<Movement, 'id'>;
};

// Schema declaration
db.version(1).stores({
  users: '++id, nombre, email, rol, departamento, activo',
  assets: '++id, codigo, tipo, estado, disponibilidad, ubicacion, propietarioId',
  movements: '++id, assetId, userId, tipo, fecha'
});

export { db };
