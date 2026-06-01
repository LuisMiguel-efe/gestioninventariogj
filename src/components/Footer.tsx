import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <p>© 2026 · 
        <a href="https://lmz-my-portfolio.vercel.app" target="_blank" rel="noopener noreferrer">
          <img style={{ width: 12, height: 12, marginLeft: '4px', marginRight: '2px', verticalAlign: 'middle', borderRadius: '50%' }} src="/lmz-light.png" alt="LMZ" />
          <b>Luis Miguel Ortiz</b>
        </a>
      </p>
    </footer>
  );
};

export default Footer;
