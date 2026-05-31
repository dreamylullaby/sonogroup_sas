import React from 'react'
import { usePreferences } from '../../context/PreferencesContext'
import '../../styles/components/Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const { t } = usePreferences()

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>SONOGROUP S.A.S</h3>
          <p>{t('heroDesc')}</p>
        </div>

        <div className="footer-section">
          <h4>{t('enlacesRapidos')}</h4>
          <ul>
            <li><a href="/">{t('inicio')}</a></li>
            <li><a href="/propiedades">{t('propiedades')}</a></li>
            <li><a href="/ayuda">{t('ayuda')}</a></li>
            <li><a href="/contacto">{t('contacto')}</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>{t('contacto')}</h4>
          <ul>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              info@sonogroup.com
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              +1 234 567 890
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Calle Principal 123
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>{t('siguenos')}</h4>
          <div className="social-links">
            <a href="#" aria-label="Facebook">Facebook</a>
            <a href="#" aria-label="Instagram">Instagram</a>
            <a href="#" aria-label="Twitter">Twitter</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} SONOGROUP S.A.S. {t('derechos')}</p>
      </div>
    </footer>
  )
}

export default Footer


