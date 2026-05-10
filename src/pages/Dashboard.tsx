import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import {
  Laptop, Monitor, Smartphone, Printer, Tablet, Mouse, Activity,
  Users as UsersIcon, Package, AlertTriangle, Clock, Download, MapPin,
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

  useEffect(() => {
    Promise.all([api.getAssets(), api.getUsers(), api.getMovements()])
      .then(([a, u, m]) => { setAssets(a); setUsers(u); setMovements(m); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const asignados = assets.filter(a => a.disponibilidad === 'asignado').length;
    const disponibles = assets.filter(a => a.disponibilidad === 'disponible').length;
    const prestados = assets.filter(a => a.disponibilidad === 'prestado').length;
    const enReparacion = assets.filter(a => a.disponibilidad === 'en reparacion').length;
    return { asignados, disponibles, prestados, enReparacion };
  }, [assets]);

  const byTipo = useMemo(() =>
    Object.entries(TIPO_CONFIG).map(([tipo, cfg]) => ({
      ...cfg, tipo,
      count: assets.filter(a => a.tipo === tipo).length,
    })), [assets]);

  const byUbicacion = useMemo(() => {
    const map: Record<string, number> = {};
    assets.forEach(a => {
      const loc = a.ubicacion || 'Sin Ubicación';
      map[loc] = (map[loc] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [assets]);

  const recentMovements = useMemo(() => movements.slice(0, 8), [movements]);
  const prestamosActivos = useMemo(() => assets.filter(a => a.disponibilidad === 'prestado'), [assets]);

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
          <h1 style={{ marginBottom: 4 }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Resumen del inventario — {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleExport}>
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0,82,165,0.1)', color: 'var(--primary-main)' }}>
            <Package size={22} />
          </div>
          <div>
            <div className="stat-value">{assets.length}</div>
            <div className="stat-label">Total Activos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(14,164,114,0.1)', color: 'var(--success)' }}>
            <Package size={22} />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.disponibles}</div>
            <div className="stat-label">Disponibles</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(49,130,206,0.1)', color: 'var(--info)' }}>
            <UsersIcon size={22} />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--info)' }}>{stats.asignados}</div>
            <div className="stat-label">Asignados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-value" style={{ color: '#7c3aed' }}>{stats.prestados}</div>
            <div className="stat-label">En Préstamo</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(229,62,62,0.1)', color: 'var(--error)' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--error)' }}>{stats.enReparacion}</div>
            <div className="stat-label">En Reparación</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(14,164,114,0.1)', color: 'var(--success)' }}>
            <UsersIcon size={22} />
          </div>
          <div>
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Empleados</div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Inventario por tipo */}
        <div className="section-card">
          <div className="section-card-header">
            <h2>Inventario por Tipo</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{assets.length} equipos total</span>
          </div>
          <div className="section-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {byTipo.map(({ tipo, label, icon, color, count }) => (
              <div key={tipo}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color, fontWeight: 600, fontSize: '0.875rem' }}>
                    {icon} {label}
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{count}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{
                    width: `${Math.round((count / (assets.length || 1)) * 100)}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}99)`,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución por ubicación */}
        <div className="section-card">
          <div className="section-card-header">
            <h2>Equipos por Área</h2>
            <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="section-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {byUbicacion.length === 0
              ? <div className="empty-state"><p>No hay equipos registrados</p></div>
              : byUbicacion.map(([loc, count]) => (
                <div key={loc}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 500 }}>{loc}</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{count} equipos</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${Math.round((count / maxUbicacion) * 100)}%` }} />
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* Últimos movimientos */}
        <div className="section-card">
          <div className="section-card-header">
            <h2>Últimos Movimientos</h2>
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
                  ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Sin movimientos</td></tr>
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
            <h2>Préstamos Activos</h2>
            <span className={`badge ${prestamosActivos.length > 0 ? 'badge-prestado' : 'badge-disponible'}`}>
              {prestamosActivos.length} activos
            </span>
          </div>
          <div className="section-card-body">
            {prestamosActivos.length === 0
              ? <div className="empty-state"><Clock size={32} /><p>No hay préstamos activos</p></div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {prestamosActivos.map(a => (
                  <div key={a.id} style={{
                    background: 'rgba(245,158,11,0.07)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {a.identificador || a.codigo}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 2 }}>
                      {a.tipo} · {a.propietario?.nombre || 'Sin asignar'}
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
