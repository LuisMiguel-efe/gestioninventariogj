import React from 'react';
import './Footer.css';

interface FooterProps {
  variant?: 'login' | 'compact';
}

const Footer: React.FC<FooterProps> = ({ variant = 'login' }) => {
  if (variant === 'compact') {
    return null;
  }

  return (
    <footer className="app-footer-professional">
      <div className="footer-content">
        <p className="footer-line">
          © {new Date().getFullYear()} Gestor de Inventario GJ
        </p>
        <p className="footer-line">
          Desarrollado por 
          <a href="https://lmz-my-portfolio.vercel.app" target="_blank" rel="noopener noreferrer" title="Portafolio de Luis Miguel Ortiz">
            <img src="/lmz-light.png" alt="LMZ" />
            <span>Luis Miguel Ortiz Muñoz</span>
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
