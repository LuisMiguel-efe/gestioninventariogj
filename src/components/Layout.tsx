import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Laptop, Users, Activity, LogOut, Wifi, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { logout, sessionUser } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const sidebarWidth = isCollapsed ? '80px' : '260px';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarWidth,
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
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expandir menú" : "Ocultar menú"}
          style={{
            position: 'absolute',
            top: '32px',
            right: '-16px',
            background: '#023e8a',
            color: 'white',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '4px solid #eef2f7',
            cursor: 'pointer',
            zIndex: 60,
            transition: 'transform 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Logo */}
        <div style={{ 
          padding: isCollapsed ? '28px 12px 24px' : '28px 20px 24px', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '6px', flexShrink: 0 }}>
              <img src="/logogj.png" alt="GJ Logo" width={36} height={40} style={{ display: 'block' }} />
            </div>
            {!isCollapsed && (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Administraciones
                </div>
                <div style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
                  GJ
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: isCollapsed ? '16px 8px' : '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', overflowX: 'hidden' }}>
          <NavSection label="Principal" collapsed={isCollapsed}>
            <SidebarLink to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" end collapsed={isCollapsed} />
          </NavSection>

          <NavSection label="Inventario" collapsed={isCollapsed}>
            <SidebarLink to="/assets" icon={<Laptop size={18} />} label="Activos" collapsed={isCollapsed} />
            <SidebarLink to="/phonelines" icon={<Wifi size={18} />} label="Líneas Móviles" collapsed={isCollapsed} />
          </NavSection>

          <NavSection label="Gestión" collapsed={isCollapsed}>
            <SidebarLink to="/users" icon={<Users size={18} />} label="Empleados" collapsed={isCollapsed} />
            <SidebarLink to="/movements" icon={<Activity size={18} />} label="Movimientos & Actas" collapsed={isCollapsed} />
          </NavSection>
        </nav>

        {/* User info + logout */}
        <div style={{ padding: isCollapsed ? '16px 8px' : '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {!isCollapsed && (
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '10px',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                Sesión activa
              </div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.3, textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {sessionUser?.nombre || 'Usuario'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {sessionUser?.rol === 'administrador' ? '🔑 Administrador' : '👤 Empleado'} · C.C. {sessionUser?.cedula}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: '10px',
              padding: isCollapsed ? '10px 0' : '10px 14px',
              background: 'rgba(229, 62, 62, 0.12)',
              color: '#fc8181',
              border: '1px solid rgba(229,62,62,0.25)',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(229,62,62,0.22)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(229,62,62,0.12)'; }}
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: sidebarWidth, padding: '28px 32px', minHeight: '100vh', transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const NavSection: React.FC<{ label: string; children: React.ReactNode; collapsed: boolean }> = ({ label, children, collapsed }) => (
  <div style={{ marginBottom: '8px' }}>
    <div style={{
      color: 'rgba(255,255,255,0.35)',
      fontSize: '0.65rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      padding: collapsed ? '12px 0 6px' : '12px 8px 6px',
      textAlign: collapsed ? 'center' : 'left',
      whiteSpace: 'nowrap',
      overflow: 'hidden'
    }}>
      {collapsed ? '—' : label}
    </div>
    {children}
  </div>
);

const SidebarLink: React.FC<{ to: string; icon: React.ReactNode; label: string; end?: boolean; collapsed: boolean }> = ({ to, icon, label, end, collapsed }) => (
  <NavLink
    to={to}
    end={end}
    title={collapsed ? label : undefined}
    className="sidebar-link"
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'flex-start',
      gap: '10px',
      padding: collapsed ? '10px 0' : '10px 12px',
      textDecoration: 'none',
      borderRadius: '10px',
      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
      backgroundColor: isActive ? 'rgba(255,255,255,0.14)' : 'transparent',
      fontWeight: isActive ? 600 : 500,
      fontSize: '0.875rem',
      transition: 'all 0.2s',
      borderLeft: isActive ? '3px solid #38b6ff' : '3px solid transparent',
      marginBottom: '2px',
      whiteSpace: 'nowrap',
    })}
  >
    {icon}
    {!collapsed && <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
  </NavLink>
);

export default Layout;
