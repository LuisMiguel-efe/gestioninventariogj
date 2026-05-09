-- PostgreSQL schema for Inventario GJ
-- Use this script to create the PostgreSQL tables and relations.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT,
  rol TEXT NOT NULL,
  departamento TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  estado TEXT NOT NULL,
  disponibilidad TEXT NOT NULL,
  ubicacion TEXT NOT NULL,
  propietario_id TEXT,
  fecha_adquisicion TIMESTAMP,
  notas TEXT,
  identificador TEXT,
  procesador TEXT,
  detalles_adicionales TEXT,
  CONSTRAINT fk_assets_propietario FOREIGN KEY (propietario_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS movements (
  id SERIAL PRIMARY KEY,
  asset_id INT NOT NULL,
  user_id TEXT NOT NULL,
  registrado_por_id TEXT NOT NULL,
  tipo TEXT NOT NULL,
  fecha TIMESTAMP NOT NULL,
  notas TEXT,
  asset_anterior_id INT,
  CONSTRAINT fk_movements_asset FOREIGN KEY (asset_id) REFERENCES assets(id),
  CONSTRAINT fk_movements_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_movements_registrado_por FOREIGN KEY (registrado_por_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS repairs (
  id SERIAL PRIMARY KEY,
  asset_id INT NOT NULL,
  fecha_reparacion TIMESTAMP NOT NULL,
  descripcion TEXT NOT NULL,
  costo DECIMAL(10, 2),
  proveedor TEXT,
  notas TEXT,
  CONSTRAINT fk_repairs_asset FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE TABLE IF NOT EXISTS maintenance (
  id SERIAL PRIMARY KEY,
  asset_id INT NOT NULL,
  fecha_mantenimiento TIMESTAMP NOT NULL,
  descripcion TEXT NOT NULL,
  costo DECIMAL(10, 2),
  proveedor TEXT,
  notas TEXT,
  CONSTRAINT fk_maintenance_asset FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE TABLE IF NOT EXISTS mobile_lines (
  id SERIAL PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  operador TEXT NOT NULL,
  plan TEXT NOT NULL,
  estado TEXT NOT NULL,
  propietario_id TEXT,
  fecha_adquisicion TIMESTAMP,
  notas TEXT,
  CONSTRAINT fk_mobile_lines_propietario FOREIGN KEY (propietario_id) REFERENCES users(id)
)
