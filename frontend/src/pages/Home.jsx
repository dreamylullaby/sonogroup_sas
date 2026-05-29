import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePreferences } from '../context/PreferencesContext'
import { api } from '../config/api'
import PropertyCard from '../components/PropertyCard'
import './Home.css'

const Home = () => {
  const navigate = useNavigate()
  const { t } = usePreferences()
  const [recientes, setRecientes] = useState([])
  const [searchOp, setSearchOp] = useState('venta')
  const [searchTipo, setSearchTipo] = useState('')
  const [searchUbicacion, setSearchUbicacion] = useState('')
  const heroRef = useRef(null)
  const carouselRef = useRef(null)

  useEffect(() => {
    api.get('/api/inmuebles?estado_aprobacion=aprobado&limit=6')
      .then(res => setRecientes((res.data.inmuebles || []).slice(0, 6)))
      .catch(() => {})
  }, [])

  // Parallax effect
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.scrollY
        heroRef.current.style.setProperty('--parallax-y', `${scrolled * 0.4}px`)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 320
      carouselRef.current.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' })
    }
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchOp) params.set('tipo_operacion', searchOp)
    if (searchTipo) params.set('tipo_inmueble', searchTipo)
    if (searchUbicacion.trim()) params.set('ubicacion', searchUbicacion.trim())
    navigate(`/propiedades?${params.toString()}`)
  }

  return (
    <div className="home">
      {/* ─── HERO ─── */}
      <section className="hero" ref={heroRef}>
        <div className="hero__bg"></div>
        <div className="hero__glass-elements" aria-hidden="true">
          <div className="glass-prism glass-prism--1"></div>
          <div className="glass-prism glass-prism--2"></div>
          <div className="glass-prism glass-prism--3"></div>
          <div className="glass-line glass-line--1"></div>
          <div className="glass-line glass-line--2"></div>
          <div className="glass-line glass-line--3"></div>
          <div className="glass-grid"></div>
        </div>
        <div className="hero__content">
          <span className="hero__eyebrow">Inmobiliaria de Excelencia</span>
          <h1 className="hero__title">SONOGROUP</h1>
          <p className="hero__subtitle">{t('heroDesc')}</p>
          <button className="hero__cta" onClick={() => navigate('/propiedades')}>
            Ver portafolio
          </button>
          {/* Search bar */}
          <div className="hero__search">
            <div className="hero__search-tabs">
              <button className={`search-tab ${searchOp === 'venta' ? 'active' : ''}`} onClick={() => setSearchOp('venta')}>Venta</button>
              <button className={`search-tab ${searchOp === 'arriendo' ? 'active' : ''}`} onClick={() => setSearchOp('arriendo')}>Arriendo</button>
            </div>
            <div className="hero__search-bar">
              <select className="search-select" value={searchTipo} onChange={(e) => setSearchTipo(e.target.value)}>
                <option value="">Tipo de propiedad</option>
                <option value="casa">Casa</option>
                <option value="apartamento">Apartamento</option>
                <option value="apartaestudio">Apartaestudio</option>
                <option value="local">Local</option>
                <option value="bodega">Bodega</option>
                <option value="finca">Finca</option>
                <option value="lote">Lote</option>
              </select>
              <input
                type="text"
                className="search-input"
                placeholder="Ubicación o palabra clave"
                value={searchUbicacion}
                onChange={(e) => setSearchUbicacion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              />
              <button className="search-btn" onClick={handleSearch}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="hero__scroll">
          <span>Continúa</span>
          <div className="hero__scroll-line"></div>
        </div>
      </section>

      {/* ─── PROPIEDADES RECIENTES (Carrusel) ─── */}
      {recientes.length > 0 && (
        <section className="recent">
          <div className="section-container">
            <div className="recent__header">
              <div>
                <div className="section-eyebrow">Portafolio</div>
                <h2 className="section-title">Listados recientes</h2>
              </div>
              {recientes.length > 3 && (
                <div className="recent__nav">
                  <button className="carousel-btn" onClick={() => scrollCarousel(-1)} aria-label="Anterior">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  </button>
                  <button className="carousel-btn" onClick={() => scrollCarousel(1)} aria-label="Siguiente">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              )}
            </div>
            <div className="recent__carousel" ref={carouselRef}>
              {recientes.map(prop => (
                <div className="recent__slide" key={prop.id_inmueble}>
                  <PropertyCard property={prop} />
                </div>
              ))}
            </div>
            <div className="recent__footer">
              <Link to="/propiedades" className="link-arrow">
                Ver todo el portafolio
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── QUIÉNES SOMOS ─── */}
      <section className="about">
        <div className="section-container">
          <div className="about__layout">
            <div className="about__text">
              <div className="section-eyebrow">Nuestra historia</div>
              <h2 className="section-title">{t('quienesSomos')}</h2>
              <p className="about__intro">{t('aboutIntro')}</p>
              {/* Floating house decoration */}
              <div className="about__float-icon" aria-hidden="true">
                <img src="/src/assets/images/casa_animacion.png" alt="" />
              </div>
            </div>
            <div className="about__cards">
              {[
                { icon: '◆', title: t('experiencia'), desc: t('experienciaDesc') },
                { icon: '◈', title: t('compromiso'), desc: t('compromisoDesc') },
                { icon: '✦', title: t('calidad'), desc: t('calidadDesc') }
              ].map(item => (
                <div key={item.title} className="about__card">
                  <span className="about__card-icon">{item.icon}</span>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SERVICIOS ─── */}
      <section className="services">
        <div className="section-container">
          <div className="section-eyebrow">Lo que hacemos</div>
          <h2 className="section-title">{t('nuestrosServicios')}</h2>
          <div className="services__grid">
            {[
              { num: '01', img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop', title: t('compraTitle'), desc: t('compraDesc') },
              { num: '02', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop', title: t('ventaTitle'), desc: t('ventaDesc') },
              { num: '03', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop', title: t('arriendoTitle'), desc: t('arriendoDesc') },
              { num: '04', img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop', title: t('asesoriaTitle'), desc: t('asesoriaDesc') }
            ].map(s => (
              <div key={s.num} className="services__card">
                <div className="services__card-img">
                  <img src={s.img} alt={s.title} loading="lazy" />
                  <span className="services__card-num">{s.num}</span>
                </div>
                <div className="services__card-body">
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── POR QUÉ ELEGIRNOS ─── */}
      <section className="whyus">
        <div className="section-container">
          <div className="whyus__layout">
            <div className="whyus__image">
              <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=1000&fit=crop" alt="Interior moderno" loading="lazy" />
            </div>
            <div className="whyus__content">
              <div className="section-eyebrow">Diferencial</div>
              <h2 className="section-title">¿Por qué elegir Sonogroup?</h2>
              <div className="whyus__list">
                {[
                  [t('portafolio'), t('portafolioDesc')],
                  [t('atencion'), t('atencionDesc')],
                  [t('transparencia'), t('transparenciaDesc')],
                  [t('tecnologia'), t('tecnologiaDesc')]
                ].map(([title, desc], i) => (
                  <div key={title} className="whyus__item">
                    <span className="whyus__item-num">0{i + 1}</span>
                    <div>
                      <h4>{title}</h4>
                      <p>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="cta-final">
        <div className="cta-final__glass" aria-hidden="true">
          <div className="glass-prism glass-prism--cta-1"></div>
          <div className="glass-prism glass-prism--cta-2"></div>
          <div className="glass-line glass-line--cta-1"></div>
          <div className="glass-line glass-line--cta-2"></div>
        </div>
        <div className="cta-final__inner">
          <h2>¿Listo para encontrar tu propiedad ideal?</h2>
          <p>{t('ctaDesc')}</p>
          <div className="cta-final__buttons">
            <button className="btn--solid" onClick={() => navigate('/propiedades')}>{t('verPropiedades')}</button>
            <button className="btn--outline" onClick={() => navigate('/contacto')}>{t('contactanos')}</button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
