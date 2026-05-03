import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Laptop, Users, Activity } from 'lucide-react';

const Layout: React.FC = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className="glass-panel" style={{
        width: '260px',
        margin: '16px',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
          <div style={{ padding: '2px', borderRadius: '3px' }}>
            <img src="logogj.png" alt="logo" width={42} height={48} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', margin: 0, lineHeight: 1.2 }}>Administraciones</h1>
            <h1 style={{ fontSize: '1.3rem', margin: 0, lineHeight: 1, color: 'var(--primary-main)' }}>GJ</h1>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SidebarLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <SidebarLink to="/assets" icon={<Laptop size={20} />} label="Gestión de Activos" />
          <SidebarLink to="/users" icon={<Users size={20} />} label="Empleados" />
          <SidebarLink to="/movements" icon={<Activity size={20} />} label="Movimientos & Actas" />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        marginLeft: '292px', // 260 width + 16 margin * 2
        padding: '24px 32px 24px 0'
      }}>
        <div className="glass-panel" style={{
          padding: '32px',
          minHeight: 'calc(100vh - 48px)'
        }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const SidebarLink: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        textDecoration: 'none',
        borderRadius: '12px',
        color: isActive ? 'var(--primary-dark)' : 'var(--text-secondary)',
        backgroundColor: isActive ? 'rgba(0, 119, 182, 0.1)' : 'transparent',
        fontWeight: isActive ? 600 : 500,
        transition: 'all 0.2s',
      })}
      className="sidebar-link"
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};

export default Layout;
