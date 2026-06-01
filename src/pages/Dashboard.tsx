import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import {
  Laptop, Monitor, Smartphone, Printer, Tablet, Mouse, Activity,
  Users as UsersIcon, Package, AlertTriangle, Clock, Download, MapPin,
  TrendingUp, BarChart3, Zap, CheckCircle, AlertCircle, X,
} from 'lucide-react';

const TIPO_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  laptop:    { label: 'Laptops',     icon: <Laptop size={20} />,      color: '#0052a5' },
  desktop:   { label: 'Desktops',    icon: <Monitor size={20} />,     color: '#1a73d4' },
  tablet:    { label: 'Tablets',     icon: <Tablet size={20} />,      color: '#7c3aed' },
  celular:   { label: 'Celulares',   icon: <Smartphone size={20} />,  color: '#0891b2' },
  impresora: { label: 'Impresoras',  icon: <Printer size={20} />,     color: '#059669' },
  pantalla:  { label: 'Pantallas',   icon: <Monitor size={20} />,     color: '#d97706' },
  accesorio: { label: 'Accesorios',  icon: <Mouse size={20} />,       color: '#6366f1' },
};

const MOVIMIENTO_LABELS: Record<string, string> = {
  asignacion: 'Asignación',
  devolucion: 'Devolución',
  cambio: 'Cambio',
  prestamo: 'Préstamo',
  retorno_prestamo: 'Retorno Préstamo',
};

const Dashboard: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [filterUbicacion, setFilterUbicacion] = useState<string>('');

  useEffect(() => {
    Promise.all([api.getAssets(), api.getUsers(), api.getMovements()])
      .then(([a, u, m]) => { setAssets(a); setUsers(u); setMovements(m); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const filtered = assets.filter(a => 
      (!filterTipo || a.tipo === filterTipo) &&
      (!filterUbicacion || a.ubicacion === filterUbicacion)
    );
    const asignados = filtered.filter(a => a.disponibilidad === 'asignado').length;
    const disponibles = filtered.filter(a => a.disponibilidad === 'disponible').length;
    const prestados = filtered.filter(a => a.disponibilidad === 'prestado').length;
    const enReparacion = filtered.filter(a => a.disponibilidad === 'en reparacion').length;
    const tazaUtilizacion = filtered.length > 0 ? Math.round(((asignados + prestados) / filtered.length) * 100) : 0;
    const tazaDisponibilidad = filtered.length > 0 ? Math.round((disponibles / filtered.length) * 100) : 0;
    return { asignados, disponibles, prestados, enReparacion, tazaUtilizacion, tazaDisponibilidad, filteredTotal: filtered.length };
  }, [assets, filterTipo, filterUbicacion]);

  const byTipo = useMemo(() =>
    Object.entries(TIPO_CONFIG).map(([tipo, cfg]) => ({
      ...cfg, tipo,
      count: assets.filter(a => a.tipo === tipo && (!filterUbicacion || a.ubicacion === filterUbicacion)).length,
    })), [assets, filterUbicacion]);

  const byUbicacion = useMemo(() => {
    const map: Record<string, number> = {};
    assets.forEach(a => {
      if (!filterTipo || a.tipo === filterTipo) {
        const loc = a.ubicacion || 'Sin Ubicación';
        map[loc] = (map[loc] || 0) + 1;
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [assets, filterTipo]);

  const recentMovements = useMemo(() => movements.slice(0, 8), [movements]);
  const prestamosActivos = useMemo(() => assets.filter(a => 
    a.disponibilidad === 'prestado' &&
    (!filterTipo || a.tipo === filterTipo) &&
    (!filterUbicacion || a.ubicacion === filterUbicacion)
  ), [assets, filterTipo, filterUbicacion]);

  const equiposPorEstado = useMemo(() => {
    const estados: Record<string, number> = {};
    const filtered = assets.filter(a => 
      (!filterTipo || a.tipo === filterTipo) &&
      (!filterUbicacion || a.ubicacion === filterUbicacion)
    );
    filtered.forEach(a => {
      const estado = a.estado || 'Desconocido';
      estados[estado] = (estados[estado] || 0) + 1;
    });
    return Object.entries(estados).sort((a, b) => b[1] - a[1]);
  }, [assets, filterTipo, filterUbicacion]);

  const handleExport = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const csv = [
      ['ID', 'Identificador', 'Tipo', 'Marca', 'Modelo', 'Estado', 'Disponibilidad', 'Ubicación', 'Propietario'].join(','),
      ...assets.map(a => [
        a.id, a.identificador || a.codigo, a.tipo, a.marca, a.modelo,
        a.estado, a.disponibilidad, a.ubicacion || '', a.propietario?.nombre || ''
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `inventario_gj_${dateStr}.csv`;
    link.click(); URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: 'var(--text-secondary)' }}>
      <div className="animate-spin" style={{ width: 28, height: 28, border: '3px solid #e4ecf5', borderTopColor: 'var(--primary-main)', borderRadius: '50%' }} />
      Cargando dashboard...
    </div>
  );

  const maxUbicacion = Math.max(...byUbicacion.map(([, c]) => c), 1);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ marginBottom: 4 }}>📊 Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Resumen del inventario — {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleExport}>
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* Filtros Interactivos */}
      <div className="section-card" style={{ marginBottom: 20, padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Filtro por Tipo */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🖥️ Tipo de Dispositivo
            </label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1.5px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                background: 'linear-gradient(135deg, rgba(0,82,165,0.06) 0%, rgba(0,82,165,0.02) 100%)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-main)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,82,165,0.1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,82,165,0.1) 0%, rgba(0,82,165,0.04) 100%)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,82,165,0.06) 0%, rgba(0,82,165,0.02) 100%)';
              }}
            >
              <option value="">Todos los Dispositivos</option>
              {byTipo.map(({ tipo, label }) => (
                <option key={tipo} value={tipo}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Ubicación */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              📍 Área / Ubicación
            </label>
            <select
              value={filterUbicacion}
              onChange={(e) => setFilterUbicacion(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1.5px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                background: 'linear-gradient(135deg, rgba(49,130,206,0.06) 0%, rgba(49,130,206,0.02) 100%)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--info)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(49,130,206,0.1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(49,130,206,0.1) 0%, rgba(49,130,206,0.04) 100%)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(49,130,206,0.06) 0%, rgba(49,130,206,0.02) 100%)';
              }}
            >
              <option value="">Todas las Áreas</option>
              {byUbicacion.map(([loc]) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(0,82,165,0.08) 0%, rgba(0,82,165,0.02) 100%)' }}>
          <div className="stat-icon" style={{ background: 'rgba(0,82,165,0.15)', color: 'var(--primary-main)' }}>
            <Package size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.filteredTotal}</div>
            <div className="stat-label">Activos {filterTipo || filterUbicacion ? '(Filtrados)' : ''}</div>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(14,164,114,0.08) 0%, rgba(14,164,114,0.02) 100%)' }}>
          <div className="stat-icon" style={{ background: 'rgba(14,164,114,0.15)', color: 'var(--success)' }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.disponibles}</div>
            <div className="stat-label">Disponibles</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {stats.tazaDisponibilidad}% del total
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(49,130,206,0.08) 0%, rgba(49,130,206,0.02) 100%)' }}>
          <div className="stat-icon" style={{ background: 'rgba(49,130,206,0.15)', color: 'var(--info)' }}>
            <Zap size={22} />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--info)' }}>{stats.asignados}</div>
            <div className="stat-label">Asignados a Empleados</div>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(124,58,237,0.02) 100%)' }}>
          <div className="stat-icon" style={{ background: 'rgba(124,58,237,0.15)', color: '#7c3aed' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="stat-value" style={{ color: '#7c3aed' }}>{stats.tazaUtilizacion}%</div>
            <div className="stat-label">Tasa de Utilización</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {stats.asignados + stats.prestados} equipos en uso
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)' }}>
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{stats.prestados}</div>
            <div className="stat-label">En Préstamo</div>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(229,62,62,0.08) 0%, rgba(229,62,62,0.02) 100%)' }}>
          <div className="stat-icon" style={{ background: 'rgba(229,62,62,0.15)', color: 'var(--error)' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--error)' }}>{stats.enReparacion}</div>
            <div className="stat-label">En Reparación</div>
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Inventario por tipo */}
        <div className="section-card">
          <div className="section-card-header">
            <h2>📦 Distribución por Tipo</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: 4 }}>
              {byTipo.filter(t => t.count > 0).length} tipos
            </span>
          </div>
          <div className="section-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {byTipo.filter(t => t.count > 0).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No hay datos para los filtros seleccionados</div>
            ) : (
              byTipo.map(({ tipo, label, icon, color, count }) => count > 0 && (
                <div key={tipo}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color, fontWeight: 600, fontSize: '0.9rem' }}>
                      <div style={{ fontSize: '1.1rem' }}>{icon}</div>
                      {label}
                    </div>
                    <span style={{ fontWeight: 700, background: `${color}20`, color, padding: '2px 8px', borderRadius: 4, fontSize: '0.8rem' }}>
                      {count}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{
                      width: `${Math.round((count / (stats.filteredTotal || 1)) * 100)}%`,
                      background: `linear-gradient(90deg, ${color}, ${color}99)`,
                      borderRadius: 'inherit',
                    }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Estado de Equipos */}
        <div className="section-card">
          <div className="section-card-header">
            <h2>🏥 Estado de Equipos</h2>
            <BarChart3 size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="section-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {equiposPorEstado.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No hay datos disponibles</div>
            ) : (
              equiposPorEstado.map(([estado, count]) => {
                const estatusColor = 
                  estado.toLowerCase().includes('activo') ? '#10b981' :
                  estado.toLowerCase().includes('reparacion') ? '#ef4444' :
                  estado.toLowerCase().includes('baja') ? '#6b7280' :
                  '#8b5cf6';
                return (
                  <div key={estado}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: estatusColor }} />
                        {estado}
                      </span>
                      <span style={{ fontWeight: 700, color: estatusColor }}>{count} ({Math.round((count / (stats.filteredTotal || 1)) * 100)}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{
                        width: `${Math.round((count / (stats.filteredTotal || 1)) * 100)}%`,
                        background: `linear-gradient(90deg, ${estatusColor}, ${estatusColor}99)`,
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Segunda fila de gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Equipos por Área */}
        <div className="section-card">
          <div className="section-card-header">
            <h2>🏢 Equipos por Área</h2>
            <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="section-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {byUbicacion.length === 0
              ? <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No hay equipos registrados</div>
              : byUbicacion.map(([loc, count]) => (
                <div key={loc}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 500 }}>📌 {loc}</span>
                    <span style={{ fontWeight: 700, background: 'rgba(49,130,206,0.1)', color: 'var(--info)', padding: '2px 8px', borderRadius: 4 }}>
                      {count} equipos
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{
                      width: `${Math.round((count / maxUbicacion) * 100)}%`,
                      background: 'linear-gradient(90deg, var(--info), var(--info)99)',
                    }} />
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Resumen de Salud del Inventario */}
        <div className="section-card">
          <div className="section-card-header">
            <h2>💚 Salud del Inventario</h2>
            <Zap size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="section-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 12, background: 'rgba(14,164,114,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(14,164,114,0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', marginBottom: 4 }}>Disponibilidad</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--success)' }}>{stats.tazaDisponibilidad}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {stats.disponibles} de {stats.filteredTotal} equipos listos para usar
              </div>
            </div>
            <div style={{ padding: 12, background: 'rgba(124,58,237,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', marginBottom: 4 }}>Utilización</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#7c3aed' }}>{stats.tazaUtilizacion}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {stats.asignados + stats.prestados} equipos en servicio activo
              </div>
            </div>
            <div style={{ padding: 12, background: 'rgba(229,62,62,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(229,62,62,0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', marginBottom: 4 }}>Requiere Atención</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--error)' }}>{stats.enReparacion}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Equipos en mantenimiento o reparación
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* Últimos movimientos */}
        <div className="section-card">
          <div className="section-card-header">
            <h2>📋 Últimos Movimientos</h2>
            <Activity size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tipo</th>
                  <th>Equipo</th>
                  <th>Empleado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.length === 0
                  ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Sin movimientos registrados</td></tr>
                  : recentMovements.map(m => (
                    <tr key={m.id}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>#{m.id}</td>
                      <td>
                        <span className={`badge badge-${m.tipo}`}>
                          {MOVIMIENTO_LABELS[m.tipo] || m.tipo}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500, fontSize: '0.8rem' }}>
                        {m.asset?.identificador || m.asset?.codigo || `#${m.assetId}`}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{m.user?.nombre || m.userId}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(m.fecha).toLocaleDateString('es-CO')}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Préstamos activos */}
        <div className="section-card">
          <div className="section-card-header">
            <h2>🔄 Préstamos Activos</h2>
            <span className={`badge ${prestamosActivos.length > 0 ? 'badge-prestado' : 'badge-disponible'}`}>
              {prestamosActivos.length}
            </span>
          </div>
          <div className="section-card-body">
            {prestamosActivos.length === 0
              ? <div className="empty-state"><Clock size={32} /><p>Sin préstamos activos</p></div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
                {prestamosActivos.slice(0, 12).map(a => (
                  <div key={a.id} style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f59e0b' }}>
                      {a.identificador || a.codigo}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: 2 }}>
                      {a.tipo} · {a.propietario?.nombre || 'Sin asignar'}
                    </div>
                  </div>
                ))}
                {prestamosActivos.length > 12 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', paddingTop: 8 }}>
                    +{prestamosActivos.length - 12} préstamos más
                  </div>
                )}
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
