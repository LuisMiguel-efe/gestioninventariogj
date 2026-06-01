import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <p>Copyright © 2026. Diseño y Desarrollo: 
        <a href="https://lmz-my-portfolio.vercel.app" target="_blank" rel="noopener noreferrer">
          <img style={{ width: 18, height: 18, marginLeft: '6px', marginRight: '4px', verticalAlign: 'middle', borderRadius: '50%' }} src="/lmz-light.png" alt="LMZ" />
          <b>Luis Miguel Ortiz Muñoz</b>
        </a> · Todos los derechos reservados.
      </p>
    </footer>
  );
};

export default Footer;
