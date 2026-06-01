import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/PreferencesContext'
import '../../styles/components/Navbar.css'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const { t } = usePreferences()
  const navigate = useNavigate()
  const location = useLocation()

  const isHomePage = location.pathname === '/'

  useEffect(() => {
    const handleScroll = () => {
      // Progress from 0 to 1 over the first 300px of scroll
      const progress = Math.min(window.scrollY / 300, 1)
      setScrollProgress(progress)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsMenuOpen(false)
    setIsUserMenuOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isUserMenuOpen])

  // Navbar: always dark #0A0F2C. On scroll add blur for depth.
  const navStyle = scrollProgress > 0 && isHomePage
    ? { background: 'rgba(10, 15, 44, 0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }
    : { background: '#0A0F2C' }

  return (
    <nav className={`navbar ${scrollProgress > 0.1 ? 'navbar-scrolled' : ''}`} style={navStyle}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src="/src/assets/images/logo_sonogroup_blanco.png" alt="Sonogroup" className="navbar-logo-img" />
          <div className="logo-content">
            <span className="logo-text">SONOGROUP</span>
            <span className="logo-subtitle">S.A.S</span>
          </div>
        </Link>

        <button
          className={`navbar-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <li><Link to="/" onClick={() => setIsMenuOpen(false)}>{t('inicio')}</Link></li>
          <li><Link to="/propiedades" onClick={() => setIsMenuOpen(false)}>{t('propiedades')}</Link></li>
          {user && (
            <li><Link to="/publicar" onClick={() => setIsMenuOpen(false)}>{t('publicar')}</Link></li>
          )}
          {!user && (
            <li><Link to="/contacto" onClick={() => setIsMenuOpen(false)}>{t('contacto')}</Link></li>
          )}
        </ul>

        <div className="navbar-actions">
          {user ? (
            <div className="user-menu-container">
              <button
                className="user-menu-trigger user-avatar-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-label="Menú de usuario"
              >
                {user.nombre.charAt(0).toUpperCase()}
              </button>

              {isUserMenuOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <div className="user-avatar-large">
                      {user.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <span className="user-name-dropdown">{user.nombre}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                  </div>

                  <div className="dropdown-divider"></div>

                  <div className="dropdown-menu">
                    {user.rol === 'admin' && (
                      <Link to="/admin" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7"></rect>
                          <rect x="14" y="3" width="7" height="7"></rect>
                          <rect x="14" y="14" width="7" height="7"></rect>
                          <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        <span>{t('panelAdmin')}</span>
                      </Link>
                    )}

                    {(user.rol === 'cliente' || user.rol === 'comisionista') && (
                      <>
                        <Link to="/favoritos" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                          <span>{t('favoritos')}</span>
                        </Link>
                        <Link to="/mis-propiedades" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                          </svg>
                          <span>{t('misPropiedades')}</span>
                        </Link>
                        <Link to="/mensajes" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                          <span>{t('mensajes')}</span>
                        </Link>
                      </>
                    )}

                    <Link to="/perfil" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <span>{t('perfil')}</span>
                    </Link>

                    <Link to="/configuracion" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                      <span>{t('configuracion')}</span>
                    </Link>
                  </div>

                  <div className="dropdown-divider"></div>

                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>{t('cerrarSesion')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                <button className="btn-secondary">{t('iniciarSesion')}</button>
              </Link>
              <Link to="/registro" className="nav-link">
                <button className="btn-primary">{t('registrarse')}</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar


