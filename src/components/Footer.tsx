import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <p>
        Desarrollado por <strong>Luis Ortiz</strong> © {currentYear} | Administraciones GJ
      </p>
    </footer>
  );
};

export default Footer;
