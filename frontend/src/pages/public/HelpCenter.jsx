import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, FileText, MessageCircle, Shield, Info, ChevronDown, Headphones, Send } from 'lucide-react'
import '../../styles/pages/HelpCenter.css'

const CATEGORIES = [
  {
    id: 'cuenta',
    icon: User,
    label: 'Cuenta',
    color: '#3B82F6',
    bg: '#EFF6FF',
    faqs: [
      { q: '¿Cómo creo una cuenta?', a: 'Haz clic en "Registrarse" en la barra de navegación. Completa el formulario con tu nombre, correo, número de identificación y contraseña. Recibirás acceso inmediato.' },
      { q: '¿Cómo cambio mi contraseña?', a: 'Ve a Configuración de la cuenta → Seguridad → Cambiar contraseña. Ingresa tu contraseña actual y la nueva. El cambio se aplica de inmediato.' },
      { q: '¿Cómo activo la verificación en dos pasos?', a: 'En Configuración → Seguridad, activa el interruptor "Verificación en dos pasos". Esto añade una capa extra de seguridad a tu cuenta.' },
      { q: '¿Puedo cambiar mi correo electrónico?', a: 'Por el momento el correo no es editable directamente. Contacta a soporte para solicitar el cambio con verificación de identidad.' },
      { q: '¿Cómo elimino mi cuenta?', a: 'En Configuración → al final del menú lateral encontrarás "Eliminar cuenta". Se te pedirá confirmar con tu contraseña. Esta acción es irreversible.' },
    ]
  },
  {
    id: 'publicacion',
    icon: FileText,
    label: 'Publicación',
    color: '#CC1E2B',
    bg: '#FEF2F2',
    faqs: [
      { q: '¿Cómo publico un inmueble?', a: 'Haz clic en "Publicar" en el menú de navegación. Completa los 4 pasos y tu propiedad quedará en revisión.' },
      { q: '¿Cuánto tarda la aprobación?', a: 'El administrador revisa en 24-48 horas hábiles. Recibirás una notificación con el resultado.' },
      { q: '¿Cómo edito una publicación?', a: 'Solo los administradores pueden editar publicaciones aprobadas. Contacta al soporte indicando el ID de tu propiedad.' },
      { q: '¿Cómo elimino una publicación?', a: 'Ve a "Mis Propiedades" → pestaña "Publicadas". Encontrarás el botón "Eliminar" en cada tarjeta.' },
      { q: '¿Por qué fue rechazada mi publicación?', a: 'Puede ser por información incompleta o imágenes de baja calidad. Revisa el motivo en "Mis Solicitudes".' },
      { q: '¿Puedo publicar varios inmuebles?', a: 'Sí, puedes enviar tantas solicitudes como necesites. Cada una pasa por revisión independiente.' },
    ]
  },
  {
    id: 'busqueda',
    icon: Search,
    label: 'Búsqueda y favoritos',
    color: '#059669',
    bg: '#ECFDF5',
    faqs: [
      { q: '¿Cómo busco propiedades?', a: 'Ve a "Propiedades" y filtra por tipo, operación, ubicación y rango de precio.' },
      { q: '¿Cómo filtro por barrio o estrato?', a: 'Usa el campo "Ubicación" para el barrio. El filtro de estrato está en filtros avanzados.' },
      { q: '¿Cómo agrego a favoritos?', a: 'En cada tarjeta de propiedad hay un ícono de corazón. Debes estar registrado.' },
      { q: '¿Dónde veo mis favoritos?', a: 'En el menú de tu perfil, selecciona "Listas de favoritos".' },
      { q: '¿Puedo compartir una propiedad?', a: 'Sí, desde el detalle puedes copiar el enlace directo para compartirlo.' },
    ]
  },
  {
    id: 'contacto',
    icon: MessageCircle,
    label: 'Contacto y solicitudes',
    color: '#7C3AED',
    bg: '#F5F3FF',
    faqs: [
      { q: '¿Cómo contacto a un propietario?', a: 'Desde el detalle de la propiedad encontrarás la información de contacto o un formulario de mensaje.' },
      { q: '¿Cómo contacto al administrador?', a: 'Ve a "Contacto" en el menú. El equipo responde en 24 horas hábiles.' },
      { q: '¿Qué hago si recibo spam?', a: 'Usa el formulario de contacto con asunto "Queja o Reclamo".' },
      { q: '¿Puedo ver mis mensajes?', a: 'Sí, en tu perfil encontrarás la sección "Mensajes" con todas tus conversaciones.' },
    ]
  },
  {
    id: 'seguridad',
    icon: Shield,
    label: 'Seguridad y privacidad',
    color: '#0891B2',
    bg: '#ECFEFF',
    faqs: [
      { q: '¿Cómo cierro sesiones en otros dispositivos?', a: 'Ve a Configuración → Seguridad → Dispositivos conectados. Cierra las que no reconozcas.' },
      { q: '¿Cómo oculto mi información personal?', a: 'En Configuración → Privacidad, activa "Ocultar información personal".' },
      { q: '¿Qué hago si accedieron a mi cuenta?', a: 'Cambia tu contraseña y cierra todas las sesiones. Si persiste, contacta soporte.' },
      { q: '¿Cómo hago mi perfil privado?', a: 'En Configuración → Privacidad, desactiva "Perfil público".' },
      { q: '¿Comparten mis datos con terceros?', a: 'No. Tu información es confidencial. Consulta la política de privacidad.' },
    ]
  },
  {
    id: 'general',
    icon: Info,
    label: 'General',
    color: '#64748B',
    bg: '#F8FAFC',
    faqs: [
      { q: '¿Cuáles son los horarios de soporte?', a: 'Lunes a viernes 9:00-18:00, sábados 9:00-13:00 (hora Colombia).' },
      { q: '¿Hay tutoriales o guías?', a: 'Próximamente publicaremos guías en video. Por ahora, este Centro de Ayuda cubre las preguntas frecuentes.' },
      { q: '¿La plataforma es gratuita?', a: 'El registro, búsqueda y publicación son completamente gratuitos.' },
      { q: '¿En qué ciudades opera SONOGROUP?', a: 'En todo el territorio colombiano. Publica y busca en cualquier municipio.' },
      { q: '¿Cómo reporto un error?', a: 'Usa el formulario de Contacto con asunto "Queja o Reclamo" y describe el error.' },
    ]
  },
]

const HelpCenter = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [openFaq, setOpenFaq] = useState({})
  const searchRef = useRef(null)

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const toggleFaq = (key) => setOpenFaq(prev => ({ ...prev, [key]: !prev[key] }))

  const searchResults = useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    const results = []
    CATEGORIES.forEach(cat => {
      cat.faqs.forEach((faq, idx) => {
        if (faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q)) {
          results.push({ ...faq, catLabel: cat.label, catColor: cat.color, catId: cat.id, idx })
        }
      })
    })
    return results
  }, [search])

  const popularFaqs = useMemo(() => {
    return CATEGORIES.flatMap(cat =>
      cat.faqs.slice(0, 2).map((faq, idx) => ({ ...faq, catLabel: cat.label, catColor: cat.color, catId: cat.id, idx }))
    ).slice(0, 6)
  }, [])

  return (
    <div className="help-page">
      {/* HERO */}
      <div className="help-hero">
        <span className="help-hero__badge"><Headphones size={14} /> CENTRO DE AYUDA</span>
        <h1>¿En qué podemos ayudarte?</h1>
        <p>Encuentra respuestas, guías y soporte para todo lo que necesitas</p>
        <div className="help-search-wrap">
          <Search size={18} className="help-search-icon" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar en todas las categorías..."
            value={search}
            onChange={e => { setSearch(e.target.value); setActiveCategory(null) }}
            className="help-search"
          />
        </div>
      </div>

      <div className="help-container">
        {/* SEARCH RESULTS */}
        {searchResults !== null ? (
          <section className="help-section">
            <h2 className="help-section__title">
              {searchResults.length > 0 ? `${searchResults.length} resultado${searchResults.length !== 1 ? 's' : ''}` : 'Sin resultados'}
            </h2>
            {searchResults.length === 0 && (
              <p className="help-empty">Intenta con otras palabras o <button onClick={() => navigate('/contacto')}>contacta a soporte</button>.</p>
            )}
            <div className="help-results-list">
              {searchResults.map((r, i) => (
                <div key={i} className="help-result-card">
                  <span className="help-result-badge" style={{ color: r.catColor }}>● {r.catLabel.toUpperCase()}</span>
                  <p className="help-result-q">{r.q}</p>
                  <p className="help-result-a">{r.a}</p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <>
            {/* CATEGORIES GRID */}
            <section className="help-section">
              <h2 className="help-section__title">EXPLORAR POR CATEGORÍA</h2>
              <div className="help-categories-grid">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon
                  return (
                    <button
                      key={cat.id}
                      className={`help-category-card ${activeCategory === cat.id ? 'active' : ''}`}
                      onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                    >
                      <span className="help-category-icon" style={{ background: cat.bg, color: cat.color }}>
                        <Icon size={18} />
                      </span>
                      <div>
                        <span className="help-category-label">{cat.label}</span>
                        <span className="help-category-count">{cat.faqs.length} artículos</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* ACTIVE CATEGORY FAQ LIST */}
            {activeCategory && (
              <section className="help-section help-active-category">
                <h2 className="help-section__title">
                  {CATEGORIES.find(c => c.id === activeCategory)?.label}
                </h2>
                <div className="help-faq-list">
                  {CATEGORIES.find(c => c.id === activeCategory)?.faqs.map((faq, idx) => {
                    const key = `${activeCategory}-${idx}`
                    const isOpen = !!openFaq[key]
                    return (
                      <div key={idx} className={`help-faq-item ${isOpen ? 'open' : ''}`}>
                        <button className="help-faq-q" onClick={() => toggleFaq(key)}>
                          <span>{faq.q}</span>
                          <ChevronDown size={16} className="help-faq-chevron" />
                        </button>
                        {isOpen && <div className="help-faq-a"><p>{faq.a}</p></div>}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* POPULAR FAQs */}
            <section className="help-section">
              <h2 className="help-section__title">Preguntas frecuentes</h2>
              <div className="help-popular-grid">
                {popularFaqs.map((faq, i) => (
                  <div key={i} className="help-popular-card" onClick={() => { setActiveCategory(faq.catId); setOpenFaq({ [`${faq.catId}-${faq.idx}`]: true }) }} style={{ cursor: 'pointer' }}>
                    <span className="help-popular-badge" style={{ color: faq.catColor }}>● {faq.catLabel.toUpperCase()}</span>
                    <p className="help-popular-q">{faq.q}</p>
                    <p className="help-popular-a">{faq.a}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* CTA */}
        <div className="help-cta">
          <div className="help-cta-icon">
            <Headphones size={28} />
          </div>
          <div className="help-cta-text">
            <h3>¿No encontraste lo que buscabas?</h3>
            <p>Nuestro equipo de soporte está listo para ayudarte.</p>
          </div>
          <button className="help-cta-btn" onClick={() => navigate('/contacto')}>
            <Send size={14} /> CONTACTAR SOPORTE
          </button>
        </div>
      </div>
    </div>
  )
}

export default HelpCenter
