import { useNavigate } from 'react-router-dom'
import { usePreferences } from '../context/PreferencesContext'
import './Home.css'

const Home = () => {
  const navigate = useNavigate()
  const { t } = usePreferences()

  return (
    <div className="home">
      <section className="hero-section">
        <div className="hero-content">
          <h1>SONOGROUP S.A.S</h1>
          <p className="hero-subtitle">{t('heroSubtitle')}</p>
          <p className="hero-description">{t('heroDesc')}</p>
          <button className="cta-button" onClick={() => navigate('/propiedades')}>{t('verPropiedades')}</button>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <div className="section-header">
            <h2>{t('quienesSomos')}</h2>
            <p className="about-intro">{t('aboutIntro')}</p>
          </div>
          <div className="about-grid">
            <div className="about-card">
              <div className="about-icon-wrapper">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <h3>{t('experiencia')}</h3>
              <p>{t('experienciaDesc')}</p>
            </div>
            <div className="about-card">
              <div className="about-icon-wrapper">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3>{t('compromiso')}</h3>
              <p>{t('compromisoDesc')}</p>
            </div>
            <div className="about-card">
              <div className="about-icon-wrapper">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <h3>{t('calidad')}</h3>
              <p>{t('calidadDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="services-section">
        <div className="container">
          <div className="section-header">
            <h2>{t('nuestrosServicios')}</h2>
            <p className="section-subtitle">{t('serviciosSubtitle')}</p>
          </div>
          <div className="services-grid">
            {[
              { num: '01', img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop', title: t('compraTitle'), desc: t('compraDesc') },
              { num: '02', img: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=600&h=400&fit=crop', title: t('ventaTitle'), desc: t('ventaDesc') },
              { num: '03', img: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&h=400&fit=crop', title: t('arriendoTitle'), desc: t('arriendoDesc') },
              { num: '04', img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop', title: t('asesoriaTitle'), desc: t('asesoriaDesc') },
            ].map(s => (
              <div key={s.num} className="service-card">
                <div className="service-image">
                  <img src={s.img} alt={s.title} />
                  <div className="service-overlay"><div className="service-number">{s.num}</div></div>
                </div>
                <div className="service-content"><h3>{s.title}</h3><p>{s.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="why-us-section">
        <div className="container">
          <h2>{t('porQueElegirnos')}</h2>
          <div className="why-us-content">
            <div className="why-us-image">
              <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600" alt="Oficina SONOGROUP" />
            </div>
            <div className="why-us-list">
              {[
                [t('portafolio'), t('portafolioDesc')],
                [t('atencion'), t('atencionDesc')],
                [t('transparencia'), t('transparenciaDesc')],
                [t('tecnologia'), t('tecnologiaDesc')],
              ].map(([title, desc]) => (
                <div key={title} className="why-us-item">
                  <span className="check-icon">✓</span>
                  <div><h4>{title}</h4><p>{desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>{t('ctaTitle')}</h2>
          <p>{t('ctaDesc')}</p>
          <div className="cta-buttons">
            <button className="btn-primary" onClick={() => navigate('/propiedades')}>{t('verPropiedades')}</button>
            <button className="btn-secondary" onClick={() => navigate('/contacto')}>{t('contactanos')}</button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
