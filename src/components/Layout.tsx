import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Laptop, Users, Activity, LogOut, Wifi } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { logout, sessionUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #012a5e 0%, #023e8a 60%, #0052a5 100%)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 50,
        boxShadow: '4px 0 24px rgba(1,42,94,0.18)',
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '6px' }}>
              <img src="/logogj.png" alt="GJ Logo" width={36} height={40} style={{ display: 'block' }} />
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Administraciones
              </div>
              <div style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
                GJ
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          <NavSection label="Principal">
            <SidebarLink to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" end />
          </NavSection>

          <NavSection label="Inventario">
            <SidebarLink to="/assets" icon={<Laptop size={18} />} label="Activos" />
            <SidebarLink to="/phonelines" icon={<Wifi size={18} />} label="Líneas Móviles" />
          </NavSection>

          <NavSection label="Gestión">
            <SidebarLink to="/users" icon={<Users size={18} />} label="Empleados" />
            <SidebarLink to="/movements" icon={<Activity size={18} />} label="Movimientos & Actas" />
          </NavSection>
        </nav>

        {/* User info + logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '10px',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
              Sesión activa
            </div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.3 }}>
              {sessionUser?.nombre || 'Usuario'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: '2px' }}>
              {sessionUser?.rol === 'administrador' ? '🔑 Administrador' : '👤 Empleado'} · C.C. {sessionUser?.cedula}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'rgba(229, 62, 62, 0.12)',
              color: '#fc8181',
              border: '1px solid rgba(229,62,62,0.25)',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(229,62,62,0.22)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(229,62,62,0.12)'; }}
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: '260px', padding: '28px 32px', minHeight: '100vh' }}>
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const NavSection: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: '8px' }}>
    <div style={{
      color: 'rgba(255,255,255,0.35)',
      fontSize: '0.65rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      padding: '12px 8px 6px',
    }}>
      {label}
    </div>
    {children}
  </div>
);

const SidebarLink: React.FC<{ to: string; icon: React.ReactNode; label: string; end?: boolean }> = ({ to, icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className="sidebar-link"
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 12px',
      textDecoration: 'none',
      borderRadius: '10px',
      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
      backgroundColor: isActive ? 'rgba(255,255,255,0.14)' : 'transparent',
      fontWeight: isActive ? 600 : 500,
      fontSize: '0.875rem',
      transition: 'all 0.2s',
      borderLeft: isActive ? '3px solid #38b6ff' : '3px solid transparent',
      marginBottom: '2px',
    })}
  >
    {icon}
    <span style={{ flex: 1 }}>{label}</span>
  </NavLink>
);

export default Layout;
