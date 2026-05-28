import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import './Navbar.css'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const { t } = usePreferences()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsMenuOpen(false)
    setIsUserMenuOpen(false)
  }

  // Cerrar menú de usuario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isUserMenuOpen])

  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div className="logo-content">
            <span className="logo-text">SONOGROUP</span>
            <span className="logo-subtitle">Real Estate</span>
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
          {user?.rol === 'admin' && (
            <>
              <li><Link to="/admin" onClick={() => setIsMenuOpen(false)}>{t('panelAdmin')}</Link></li>
              <li><Link to="/publicar" onClick={() => setIsMenuOpen(false)}>{t('publicar')}</Link></li>
            </>
          )}
          {(user?.rol === 'cliente' || user?.rol === 'comisionista') && (
            <li><Link to="/publicar" onClick={() => setIsMenuOpen(false)}>{t('publicar')}</Link></li>
          )}
          {user?.rol !== 'admin' && (
            <li><Link to="/contacto" onClick={() => setIsMenuOpen(false)}>{t('contacto')}</Link></li>
          )}
        </ul>

        <div className="navbar-actions">
          {user ? (
            <>

              
              <div className="user-menu-container">
                <button 
                  className="user-menu-trigger"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <div className="user-avatar">
                    {user.nombre.charAt(0).toUpperCase()}
                  </div>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    className={`dropdown-arrow ${isUserMenuOpen ? 'open' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
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
                      {(user.rol === 'cliente' || user.rol === 'comisionista') && (
                        <>
                          <Link to="/favoritos" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span>{t('favoritos')}</span>
                          </Link>
                          <Link to="/mis-propiedades" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            </svg>
                            <span>{t('misPropiedades')}</span>
                          </Link>
                          <Link to="/mensajes" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span>{t('mensajes')}</span>
                          </Link>
                        </>
                      )}
                      
                      {user.rol === 'admin' && (
                        <Link to="/admin" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                          </svg>
                          <span>{t('panelAdmin')}</span>
                        </Link>
                      )}

                      <Link to="/perfil" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>{t('perfil')}</span>
                      </Link>

                      <Link to="/configuracion" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M12 1v6m0 6v6m-9-9h6m6 0h6"></path>
                        </svg>
                        <span>{t('configuracion')}</span>
                      </Link>
                    </div>

                    <div className="dropdown-divider"></div>

                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      <span>{t('cerrarSesion')}</span>
                    </button>
                  </div>
                )}
              </div>
            </>
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
