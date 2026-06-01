import React from 'react';
import './Footer.css';

interface FooterProps {
  variant?: 'login' | 'compact';
}

const Footer: React.FC<FooterProps> = ({ variant = 'login' }) => {
  if (variant === 'compact') {
    return null; // No mostrar en navegación
  }

  return (
    <footer className="app-footer-professional">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Gestor de Inventario</h4>
          <p>Sistema integrado de administración de activos y líneas móviles para Administraciones GJ</p>
          <div className="footer-social">
            <a href="https://lmz-my-portfolio.vercel.app" target="_blank" rel="noopener noreferrer" title="Desarrollador">
              <img src="/lmz-light.png" alt="LMZ" />
            </a>
          </div>
        </div>
        <div className="footer-section">
          <h5>Enlaces</h5>
          <ul>
            <li><a href="#">Documentación</a></li>
            <li><a href="#">Soporte</a></li>
            <li><a href="#">Privacidad</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h5>Información</h5>
          <ul>
            <li>© 2026 Administraciones GJ</li>
            <li>Todos los derechos reservados</li>
            <li><a href="https://lmz-my-portfolio.vercel.app" target="_blank" rel="noopener noreferrer">Desarrollado por Luis Miguel Ortiz</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Gestión de Inventario GJ. Desarrollado profesionalmente.</p>
      </div>
    </footer>
  );
};

export default Footer;
