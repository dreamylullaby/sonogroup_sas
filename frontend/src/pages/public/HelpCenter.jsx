import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../styles/pages/HelpCenter.css'

const DATA = [
  {
    id: 'cuenta',
    icon: '👤',
    label: 'Cuenta',
    popular: [0, 1],
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
    icon: '🏠',
    label: 'Publicación',
    popular: [0, 1],
    faqs: [
      { q: '¿Cómo publico un inmueble?', a: 'Haz clic en "Publicar" en el menú de navegación. Completa el formulario en 4 pasos: tipo de inmueble, detalles, ubicación y características específicas. Al enviar, quedará en revisión.' },
      { q: '¿Cuánto tarda la aprobación?', a: 'El administrador revisa las solicitudes en un plazo de 24 a 48 horas hábiles. Recibirás una notificación cuando tu publicación sea aprobada o rechazada.' },
      { q: '¿Cómo edito una publicación?', a: 'Solo los administradores pueden editar publicaciones aprobadas. Si necesitas hacer cambios, contacta al soporte indicando el ID de tu propiedad.' },
      { q: '¿Cómo elimino una publicación?', a: 'Ve a "Mis Propiedades" → pestaña "Publicadas". Encontrarás el botón "Eliminar" en cada tarjeta. La eliminación es permanente.' },
      { q: '¿Por qué fue rechazada mi publicación?', a: 'El administrador puede rechazar publicaciones con información incompleta, imágenes de baja calidad o que no cumplan las políticas de la plataforma. Revisa el motivo en "Mis Solicitudes".' },
      { q: '¿Puedo publicar varios inmuebles?', a: 'Sí, puedes enviar tantas solicitudes de publicación como necesites. Cada una pasa por el proceso de revisión de forma independiente.' },
    ]
  },
  {
    id: 'busqueda',
    icon: '🔍',
    label: 'Búsqueda y favoritos',
    popular: [0, 2],
    faqs: [
      { q: '¿Cómo busco propiedades?', a: 'Ve a la sección "Propiedades" desde el menú. Puedes filtrar por tipo de inmueble, tipo de operación (venta/arriendo), ubicación y rango de precio.' },
      { q: '¿Cómo filtro por barrio o estrato?', a: 'En la página de Propiedades, usa el campo "Ubicación" para escribir el nombre del barrio o municipio. El filtro de estrato está disponible en los filtros avanzados.' },
      { q: '¿Cómo agrego una propiedad a favoritos?', a: 'En la tarjeta de cada propiedad encontrarás un ícono de corazón. Haz clic para guardarla. Debes estar registrado para usar esta función.' },
      { q: '¿Dónde veo mis favoritos?', a: 'En el menú desplegable de tu perfil, selecciona "Listas de favoritos". Allí encontrarás todas las propiedades que has guardado.' },
      { q: '¿Puedo compartir una propiedad?', a: 'Sí, desde el detalle de cada propiedad puedes copiar el enlace directo para compartirlo por cualquier medio.' },
    ]
  },
  {
    id: 'contacto',
    icon: '💬',
    label: 'Contacto y solicitudes',
    popular: [0, 1],
    faqs: [
      { q: '¿Cómo contacto a un propietario?', a: 'Desde el detalle de la propiedad, encontrarás la información de contacto del propietario o un formulario para enviarle un mensaje directamente.' },
      { q: '¿Cómo contacto al administrador?', a: 'Ve a la sección "Contacto" en el menú principal. Completa el formulario indicando tu consulta. El equipo responde en un plazo de 24 horas hábiles.' },
      { q: '¿Qué hago si recibo spam o mensajes inapropiados?', a: 'Usa el formulario de contacto y selecciona el asunto "Queja o Reclamo". Describe la situación y el equipo tomará las medidas necesarias.' },
      { q: '¿Puedo ver el historial de mis mensajes?', a: 'Sí, en el menú de tu perfil encontrarás la sección "Mensajes" donde puedes ver todas tus conversaciones.' },
    ]
  },
  {
    id: 'seguridad',
    icon: '🔒',
    label: 'Seguridad y privacidad',
    popular: [0, 2],
    faqs: [
      { q: '¿Cómo cierro sesiones activas en otros dispositivos?', a: 'Ve a Configuración → Seguridad → Dispositivos conectados. Verás la lista de sesiones activas y podrás cerrar cada una individualmente o todas a la vez.' },
      { q: '¿Cómo oculto mi información personal?', a: 'En Configuración → Privacidad, activa "Ocultar información personal". Esto ocultará tu teléfono y correo en tus publicaciones.' },
      { q: '¿Qué hago si alguien accedió a mi cuenta sin permiso?', a: 'Cambia tu contraseña inmediatamente desde Configuración → Seguridad. Luego cierra todas las sesiones activas. Si el problema persiste, contacta a soporte.' },
      { q: '¿Cómo hago mi perfil privado?', a: 'En Configuración → Privacidad, desactiva "Perfil público". Tu perfil dejará de ser visible para otros usuarios.' },
      { q: '¿SONOGROUP comparte mis datos con terceros?', a: 'No. Tu información personal es confidencial y solo se usa para el funcionamiento de la plataforma. Consulta nuestra política de privacidad para más detalles.' },
    ]
  },
  {
    id: 'general',
    icon: '📋',
    label: 'General',
    popular: [0, 1],
    faqs: [
      { q: '¿Cuáles son los horarios de soporte?', a: 'Nuestro equipo de soporte está disponible de lunes a viernes de 9:00 a 18:00 y sábados de 9:00 a 13:00 (hora Colombia).' },
      { q: '¿Hay tutoriales o guías de uso?', a: 'Próximamente publicaremos guías en video y documentación detallada. Por ahora, este Centro de Ayuda cubre las preguntas más frecuentes.' },
      { q: '¿La plataforma es gratuita?', a: 'El registro y la búsqueda de propiedades son completamente gratuitos. La publicación de inmuebles también es gratuita en su versión actual.' },
      { q: '¿En qué ciudades opera SONOGROUP?', a: 'Actualmente operamos en todo el territorio colombiano. Puedes publicar y buscar propiedades en cualquier municipio del país.' },
      { q: '¿Cómo reporto un error en la plataforma?', a: 'Usa el formulario de Contacto y selecciona "Queja o Reclamo". Describe el error con el mayor detalle posible para que podamos resolverlo rápidamente.' },
    ]
  },
]

const HelpCenter = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [openCategory, setOpenCategory] = useState(null)
  const [openFaq, setOpenFaq] = useState({})

  const toggleCategory = (id) => setOpenCategory(prev => prev === id ? null : id)
  const toggleFaq = (catId, idx) => setOpenFaq(prev => ({
    ...prev, [`${catId}-${idx}`]: !prev[`${catId}-${idx}`]
  }))

  const searchResults = useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    const results = []
    DATA.forEach(cat => {
      cat.faqs.forEach((faq, idx) => {
        if (faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q)) {
          results.push({ ...faq, catLabel: cat.label, catIcon: cat.icon, catId: cat.id, idx })
        }
      })
    })
    return results
  }, [search])

  const popularFaqs = DATA.flatMap(cat =>
    cat.popular.map(idx => ({ ...cat.faqs[idx], catLabel: cat.label, catIcon: cat.icon }))
  ).slice(0, 6)

  return (
    <div className="help-page">
      {/* HERO */}
      <div className="help-hero">
        <h1>Centro de Ayuda</h1>
        <p>¿En qué podemos ayudarte hoy?</p>
        <div className="help-search-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar en todas las categorías..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="help-search"
          />
          {search && (
            <button className="help-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      </div>

      <div className="help-container">

        {/* RESULTADOS DE BÚSQUEDA */}
        {searchResults !== null && (
          <div className="help-search-results">
            <h2>{searchResults.length > 0 ? `${searchResults.length} resultado${searchResults.length !== 1 ? 's' : ''} para "${search}"` : `Sin resultados para "${search}"`}</h2>
            {searchResults.length === 0 && (
              <p className="help-no-results">Intenta con otras palabras o <button onClick={() => navigate('/contacto')}>contacta a soporte</button>.</p>
            )}
            {searchResults.map((r, i) => (
              <div key={i} className="help-result-item">
                <span className="help-result-cat">{r.catIcon} {r.catLabel}</span>
                <p className="help-result-q">{r.q}</p>
                <p className="help-result-a">{r.a}</p>
              </div>
            ))}
          </div>
        )}

        {/* POPULARES */}
        {!search && (
          <div className="help-popular">
            <h2>Preguntas frecuentes</h2>
            <div className="help-popular-grid">
              {popularFaqs.map((f, i) => (
                <div key={i} className="help-popular-card">
                  <span className="help-popular-icon">{f.catIcon}</span>
                  <div>
                    <p className="help-popular-cat">{f.catLabel}</p>
                    <p className="help-popular-q">{f.q}</p>
                    <p className="help-popular-a">{f.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORÍAS */}
        {!search && (
          <div className="help-categories">
            <h2>Explorar por categoría</h2>
            {DATA.map(cat => (
              <div key={cat.id} className={`help-cat ${openCategory === cat.id ? 'open' : ''}`}>
                <button className="help-cat-header" onClick={() => toggleCategory(cat.id)}>
                  <span className="help-cat-icon">{cat.icon}</span>
                  <span className="help-cat-label">{cat.label}</span>
                  <span className="help-cat-count">{cat.faqs.length} preguntas</span>
                  <svg className="help-cat-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                <div className="help-cat-body">
                  {cat.faqs.map((faq, idx) => {
                    const key = `${cat.id}-${idx}`
                    const isOpen = !!openFaq[key]
                    return (
                      <div key={idx} className={`help-faq ${isOpen ? 'open' : ''}`}>
                        <button className="help-faq-q" onClick={() => toggleFaq(cat.id, idx)}>
                          <span>{faq.q}</span>
                          <svg className="help-faq-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </button>
                        <div className="help-faq-a">
                          <p>{faq.a}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA SOPORTE */}
        <div className="help-cta">
          <div className="help-cta-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <h3>¿No encontraste lo que buscabas?</h3>
            <p>Nuestro equipo de soporte está listo para ayudarte.</p>
          </div>
          <button className="help-cta-btn" onClick={() => navigate('/contacto')}>
            Contactar soporte
          </button>
        </div>

      </div>
    </div>
  )
}

export default HelpCenter

