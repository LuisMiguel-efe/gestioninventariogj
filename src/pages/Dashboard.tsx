import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Users as UsersIcon, Laptop, Activity, AlertCircle, Download } from 'lucide-react';
import { exportToCSV } from '../utils/export';

const Dashboard: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);

  useEffect(() => {
    api.getAssets().then(setAssets).catch(console.error);
    api.getUsers().then(setUsers).catch(console.error);
    api.getMovements().then(setMovements).catch(console.error);
  }, []);

  const underRepair = assets.filter(a => a.disponibilidad === 'en reparacion').length || 0;

  // Group ALL assets by location
  const groupedByUbicacion = assets.reduce((acc, curr) => {
    const loc = curr.ubicacion || 'Sin Ubicación';
    if (!acc[loc]) {
      acc[loc] = { total: 0, byType: {} };
    }
    acc[loc].total += 1;
    
    const type = curr.tipo || 'desconocido';
    acc[loc].byType[type] = (acc[loc].byType[type] || 0) + 1;
    
    return acc;
  }, {} as Record<string, { total: number, byType: Record<string, number> }>);

  const handleExportAll = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    if (assets.length) exportToCSV(assets, `inventario_activos_${dateStr}`);
    if (users.length) exportToCSV(users, `inventario_usuarios_${dateStr}`);
    if (movements.length) exportToCSV(movements, `inventario_movimientos_${dateStr}`);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.875rem', margin: 0 }}>Dashboard</h1>
        <button onClick={handleExportAll} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={18} />
          Exportar BD a CSV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <StatCard title="Total Activos" value={assets.length} icon={<Laptop size={24} />} color="var(--primary-main)" />
        <StatCard title="Activos en Reparación" value={underRepair} icon={<AlertCircle size={24} />} color="var(--warning)" />
        <StatCard title="Total Empleados" value={users.length} icon={<UsersIcon size={24} />} color="var(--success)" />
        <StatCard title="Movimientos Registrados" value={movements.length} icon={<Activity size={24} />} color="var(--accent)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Inventario por Tipo (Global)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <TypeBar label="Laptops" count={assets.filter(a => a.tipo === 'laptop').length} total={assets.length || 1} />
             <TypeBar label="Desktops" count={assets.filter(a => a.tipo === 'desktop').length} total={assets.length || 1} />
             <TypeBar label="Impresoras" count={assets.filter(a => a.tipo === 'impresora').length} total={assets.length || 1} />
             <TypeBar label="Accesorios" count={assets.filter(a => a.tipo === 'accesorio').length} total={assets.length || 1} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Últimos Movimientos</h2>
          {movements.slice().reverse().slice(0, 5).map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{m.tipo}</span>
                <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>Asset ID: {m.assetId}</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {new Date(m.fecha).toLocaleDateString()}
              </div>
            </div>
          ))}
          {movements.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No hay movimientos recientes.</p>}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginTop: '24px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Equipos Asignados y Disponibles por Ubicación</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {Object.entries(groupedByUbicacion).map(([ubicacion, data]: [string, any]) => (
             <div key={ubicacion} style={{ padding: '16px', backgroundColor: 'var(--surface-solid)', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                 <h3 style={{ fontSize: '1.125rem', margin: 0 }}>{ubicacion}</h3>
                 <span className="badge badge-asignado">{data.total} equipos</span>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 {Object.entries(data.byType).map(([type, count]) => (
                    <TypeBar key={type} label={type.charAt(0).toUpperCase() + type.slice(1)} count={count as number} total={data.total} isRelative={true} />
                 ))}
               </div>
             </div>
          ))}
          {Object.keys(groupedByUbicacion).length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No hay equipos registrados en el inventario.</p>}
        </div>
      </div>
    </div>
  );
}

const StatCard: React.FC<{ title: string, value: number, icon: React.ReactNode, color: string }> = ({ title, value, icon, color }) => (
  <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ background: `${color}20`, color: color, padding: '16px', borderRadius: '16px' }}>
      {icon}
    </div>
    <div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.2 }}>{value}</div>
    </div>
  </div>
);

const TypeBar: React.FC<{ label: string, count: number, total: number, isRelative?: boolean }> = ({ label, count, total, isRelative }) => {
  const percentage = Math.round((count / total) * 100) || 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.875rem' }}>
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span>{count} {isRelative ? '' : `(${percentage}%)`}</span>
      </div>
      <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${percentage}%`, height: '100%', background: 'var(--primary-main)', transition: 'width 1s ease-out' }}></div>
      </div>
    </div>
  );
}

export default Dashboard;
