import { createContext, useContext, useState, useEffect } from 'react'

const PreferencesContext = createContext(null)

const translations = {
  es: {
    // Navbar
    inicio: 'Inicio', propiedades: 'Propiedades', contacto: 'Contacto',
    publicar: 'Publicar', panelAdmin: 'Panel Admin',
    iniciarSesion: 'Iniciar Sesión', registrarse: 'Registrarse',
    cerrarSesion: 'Cerrar sesión', perfil: 'Perfil',
    configuracion: 'Configuración de la cuenta', ayuda: 'Centro de ayuda',
    favoritos: 'Listas de favoritos', misPropiedades: 'Mis propiedades',
    mensajes: 'Mensajes',
    // Footer
    enlacesRapidos: 'Enlaces Rápidos', vender: 'Vender',
    siguenos: 'Síguenos', derechos: 'Todos los derechos reservados.',
    // Home
    heroSubtitle: 'Soluciones inmobiliarias de excelencia',
    heroDesc: 'Tu socio confiable en inversiones y propiedades',
    verPropiedades: 'Ver Propiedades', contactanos: 'Contáctanos',
    quienesSomos: '¿Quiénes Somos?',
    aboutIntro: 'SONOGROUP S.A.S es una empresa líder en el sector inmobiliario, comprometida con ofrecer soluciones integrales para la compra, venta y arriendo de propiedades.',
    experiencia: 'Experiencia', experienciaDesc: 'Años de trayectoria en el mercado inmobiliario, brindando confianza y profesionalismo a nuestros clientes.',
    compromiso: 'Compromiso', compromisoDesc: 'Nos dedicamos a entender las necesidades de cada cliente para ofrecer soluciones personalizadas.',
    calidad: 'Calidad', calidadDesc: 'Seleccionamos cuidadosamente cada propiedad para garantizar la mejor inversión para ti.',
    nuestrosServicios: 'Nuestros Servicios',
    serviciosSubtitle: 'Soluciones integrales para todas tus necesidades inmobiliarias',
    compraTitle: 'Compra de Propiedades', compraDesc: 'Te ayudamos a encontrar la propiedad perfecta que se ajuste a tus necesidades y presupuesto.',
    ventaTitle: 'Venta de Inmuebles', ventaDesc: 'Gestionamos la venta de tu propiedad con estrategias efectivas de marketing y negociación.',
    arriendoTitle: 'Arriendo', arriendoDesc: 'Ofrecemos opciones de arriendo con contratos seguros y propiedades verificadas.',
    asesoriaTitle: 'Asesoría Inmobiliaria', asesoriaDesc: 'Brindamos consultoría especializada para inversiones y proyectos inmobiliarios.',
    porQueElegirnos: '¿Por Qué Elegir SONOGROUP?',
    portafolio: 'Portafolio Diverso', portafolioDesc: 'Amplia variedad de propiedades: casas, apartamentos, locales comerciales y más.',
    atencion: 'Atención Personalizada', atencionDesc: 'Equipo de profesionales dedicados a brindarte el mejor servicio.',
    transparencia: 'Transparencia', transparenciaDesc: 'Información clara y detallada de cada propiedad sin costos ocultos.',
    tecnologia: 'Tecnología', tecnologiaDesc: 'Plataforma digital moderna para facilitar tu búsqueda y gestión.',
    ctaTitle: '¿Listo para Encontrar tu Propiedad Ideal?',
    ctaDesc: 'Explora nuestro portafolio y descubre las mejores oportunidades del mercado',
    // Login
    iniciarSesionTitle: 'Iniciar Sesión', accedeTuCuenta: 'Accede a tu cuenta',
    emailLabel: 'Email', passwordLabel: 'Contraseña',
    iniciandoSesion: 'Iniciando sesión...', noTienesCuenta: '¿No tienes cuenta?',
    registrateAqui: 'Regístrate aquí', completaTodos: 'Por favor completa todos los campos',
    // Register
    crearCuenta: 'Crear Cuenta', registrateAcceder: 'Regístrate para acceder a todas las funcionalidades',
    nombreCompleto: 'Nombre Completo', telefono: 'Teléfono',
    tipoId: 'Tipo de Identificación', numeroId: 'Número de Identificación',
    confirmarPassword: 'Confirmar Contraseña', minCaracteres: 'Mínimo 6 caracteres',
    creandoCuenta: 'Creando cuenta...', yaTienesCuenta: '¿Ya tienes cuenta?',
    iniciaSesionAqui: 'Inicia sesión aquí',
    cedula: 'Cédula de Ciudadanía', cedulaExt: 'Cédula de Extranjería',
    pasaporte: 'Pasaporte',
    // Contact
    contactanosTitle: 'Contáctanos',
    contactanosDesc: 'Estamos aquí para ayudarte. Envíanos tu consulta y te responderemos pronto.',
    nombreLabel: 'Nombre Completo', asuntoLabel: 'Asunto', mensajeLabel: 'Mensaje',
    enviarMensaje: 'Enviar Mensaje', enviando: 'Enviando...',
    mensajeExitoso: '¡Mensaje enviado exitosamente! Te contactaremos pronto.',
    seleccionaAsunto: 'Selecciona un asunto',
    consultaGeneral: 'Consulta General', infoPropiedad: 'Información sobre una Propiedad',
    agendarVisita: 'Agendar Visita', cotizacion: 'Solicitar Cotización',
    venderPropiedad: 'Quiero Vender mi Propiedad', arrendarPropiedad: 'Quiero Arrendar mi Propiedad',
    asesoriaInversion: 'Asesoría de Inversión', financiamiento: 'Consulta sobre Financiamiento',
    quejaReclamo: 'Queja o Reclamo', otro: 'Otro',
    infoContacto: 'Información de Contacto', direccion: 'Dirección',
    telefonoLabel: 'Teléfono', horario: 'Horario',
    horarioSemana: 'Lunes a Viernes: 9:00 - 18:00', horarioSabado: 'Sábados: 9:00 - 13:00',
    // Properties
    nuestrasPropiedades: 'Nuestras Propiedades',
    exploraPortafolio: 'Explora nuestro portafolio de inmuebles disponibles',
    propiedadesDisponibles: 'Propiedades Disponibles', resultados: 'resultados', resultado: 'resultado',
    cargandoPropiedades: 'Cargando propiedades...',
    noResultados: 'No se encontraron propiedades con los filtros seleccionados',
    // Profile
    informacionPersonal: 'Información Personal', actividad: 'Actividad',
    propiedadesPublicadas: 'Propiedades publicadas', favoritosGuardados: 'Favoritos guardados',
    mensajesEnviados: 'Mensajes enviados', miembroDesde: 'Miembro desde',
    // MyProperties
    misPropiedadesTitle: 'Mis Propiedades', gestionaTus: 'Gestiona tus publicaciones y solicitudes',
    nuevaPropiedad: 'Nueva Propiedad', publicadas: 'Publicadas', misSolicitudes: 'Mis Solicitudes',
    noPublicadas: 'No tienes propiedades publicadas', enviaUna: 'Envía una solicitud y el administrador la revisará',
    publicarPropiedad: 'Publicar propiedad', noSolicitudes: 'No tienes solicitudes enviadas',
    cuandoEnvies: 'Cuando envíes una propiedad para revisión aparecerá aquí',
    enviarSolicitud: 'Enviar solicitud', enviado: 'Enviado:',
    pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado',
    motivo: 'Motivo:', ver: 'Ver', eliminar: 'Eliminar',
    // Settings
    configuracionTitle: 'Configuración de la cuenta',
    configuracionDesc: 'Gestiona tu seguridad, preferencias y privacidad',
    seguridad: 'Seguridad', preferencias: 'Preferencias', privacidad: 'Privacidad',
    cambiarPassword: 'Cambiar contraseña', passwordActual: 'Contraseña actual',
    passwordNuevo: 'Nueva contraseña', confirmarNuevo: 'Confirmar nueva contraseña',
    actualizarPassword: 'Actualizar contraseña', actualizando: 'Actualizando...',
    verificacion2fa: 'Verificación en dos pasos',
    verificacion2faDesc: 'Añade una capa extra de seguridad a tu cuenta.',
    activar2fa: 'Activar verificación en dos pasos',
    dispositivosConectados: 'Dispositivos conectados', cerrarTodas: 'Cerrar todas',
    noSesiones: 'No hay sesiones activas registradas.',
    ultimaActividad: 'Última actividad:', cerrar: 'Cerrar',
    idiomaLabel: 'Idioma', temaVisual: 'Tema visual',
    modoClaro: 'Claro', modoOscuro: 'Oscuro',
    notificaciones: 'Notificaciones',
    notifEmail: 'Recibir notificaciones por correo',
    notifApp: 'Notificaciones dentro de la plataforma',
    guardarPreferencias: 'Guardar preferencias', guardando: 'Guardando...',
    perfilPublico: 'Perfil público', perfilPublicoDesc: 'Tu perfil será visible para otros usuarios',
    permitirContacto: 'Permitir contacto', permitirContactoDesc: 'Otros usuarios pueden contactarte desde tus publicaciones',
    ocultarInfo: 'Ocultar información personal', ocultarInfoDesc: 'Oculta teléfono y correo en tus publicaciones',
    guardarPrivacidad: 'Guardar privacidad',
    eliminarCuenta: 'Eliminar cuenta',
    eliminarCuentaTitle: 'Eliminar cuenta',
    eliminarCuentaDesc: 'Esta acción es irreversible. Tu cuenta quedará desactivada y no podrás recuperarla.',
    confirmaPassword: 'Confirma tu contraseña', cancelar: 'Cancelar',
    eliminarMiCuenta: 'Eliminar mi cuenta', eliminando: 'Eliminando...',
    passwordGuardada: 'Contraseña actualizada correctamente',
    configuracionGuardada: 'Configuración guardada',
  },
  en: {
    // Navbar
    inicio: 'Home', propiedades: 'Properties', contacto: 'Contact',
    publicar: 'Publish', panelAdmin: 'Admin Panel',
    iniciarSesion: 'Sign In', registrarse: 'Sign Up',
    cerrarSesion: 'Sign out', perfil: 'Profile',
    configuracion: 'Account settings', ayuda: 'Help center',
    favoritos: 'Favorites', misPropiedades: 'My properties',
    mensajes: 'Messages',
    // Footer
    enlacesRapidos: 'Quick Links', vender: 'Sell',
    siguenos: 'Follow Us', derechos: 'All rights reserved.',
    // Home
    heroSubtitle: 'Excellence in real estate solutions',
    heroDesc: 'Your trusted partner in investments and properties',
    verPropiedades: 'View Properties', contactanos: 'Contact Us',
    quienesSomos: 'Who We Are?',
    aboutIntro: 'SONOGROUP S.A.S is a leading company in the real estate sector, committed to offering comprehensive solutions for buying, selling and renting properties.',
    experiencia: 'Experience', experienciaDesc: 'Years of experience in the real estate market, providing trust and professionalism to our clients.',
    compromiso: 'Commitment', compromisoDesc: 'We are dedicated to understanding each client\'s needs to offer personalized solutions.',
    calidad: 'Quality', calidadDesc: 'We carefully select each property to ensure the best investment for you.',
    nuestrosServicios: 'Our Services',
    serviciosSubtitle: 'Comprehensive solutions for all your real estate needs',
    compraTitle: 'Property Purchase', compraDesc: 'We help you find the perfect property that fits your needs and budget.',
    ventaTitle: 'Property Sale', ventaDesc: 'We manage the sale of your property with effective marketing and negotiation strategies.',
    arriendoTitle: 'Rental', arriendoDesc: 'We offer rental options with secure contracts and verified properties.',
    asesoriaTitle: 'Real Estate Advisory', asesoriaDesc: 'We provide specialized consulting for investments and real estate projects.',
    porQueElegirnos: 'Why Choose SONOGROUP?',
    portafolio: 'Diverse Portfolio', portafolioDesc: 'Wide variety of properties: houses, apartments, commercial spaces and more.',
    atencion: 'Personalized Attention', atencionDesc: 'Team of professionals dedicated to providing you the best service.',
    transparencia: 'Transparency', transparenciaDesc: 'Clear and detailed information on each property with no hidden costs.',
    tecnologia: 'Technology', tecnologiaDesc: 'Modern digital platform to facilitate your search and management.',
    ctaTitle: 'Ready to Find Your Ideal Property?',
    ctaDesc: 'Explore our portfolio and discover the best market opportunities',
    // Login
    iniciarSesionTitle: 'Sign In', accedeTuCuenta: 'Access your account',
    emailLabel: 'Email', passwordLabel: 'Password',
    iniciandoSesion: 'Signing in...', noTienesCuenta: "Don't have an account?",
    registrateAqui: 'Sign up here', completaTodos: 'Please complete all fields',
    // Register
    crearCuenta: 'Create Account', registrateAcceder: 'Sign up to access all features',
    nombreCompleto: 'Full Name', telefono: 'Phone',
    tipoId: 'ID Type', numeroId: 'ID Number',
    confirmarPassword: 'Confirm Password', minCaracteres: 'Minimum 6 characters',
    creandoCuenta: 'Creating account...', yaTienesCuenta: 'Already have an account?',
    iniciaSesionAqui: 'Sign in here',
    cedula: 'National ID', cedulaExt: 'Foreign ID',
    pasaporte: 'Passport',
    // Contact
    contactanosTitle: 'Contact Us',
    contactanosDesc: 'We are here to help. Send us your inquiry and we will respond soon.',
    nombreLabel: 'Full Name', asuntoLabel: 'Subject', mensajeLabel: 'Message',
    enviarMensaje: 'Send Message', enviando: 'Sending...',
    mensajeExitoso: 'Message sent successfully! We will contact you soon.',
    seleccionaAsunto: 'Select a subject',
    consultaGeneral: 'General Inquiry', infoPropiedad: 'Property Information',
    agendarVisita: 'Schedule Visit', cotizacion: 'Request Quote',
    venderPropiedad: 'I want to Sell', arrendarPropiedad: 'I want to Rent',
    asesoriaInversion: 'Investment Advisory', financiamiento: 'Financing Inquiry',
    quejaReclamo: 'Complaint', otro: 'Other',
    infoContacto: 'Contact Information', direccion: 'Address',
    telefonoLabel: 'Phone', horario: 'Hours',
    horarioSemana: 'Monday to Friday: 9:00 - 18:00', horarioSabado: 'Saturdays: 9:00 - 13:00',
    // Properties
    nuestrasPropiedades: 'Our Properties',
    exploraPortafolio: 'Explore our portfolio of available properties',
    propiedadesDisponibles: 'Available Properties', resultados: 'results', resultado: 'result',
    cargandoPropiedades: 'Loading properties...',
    noResultados: 'No properties found with the selected filters',
    // Profile
    informacionPersonal: 'Personal Information', actividad: 'Activity',
    propiedadesPublicadas: 'Published properties', favoritosGuardados: 'Saved favorites',
    mensajesEnviados: 'Messages sent', miembroDesde: 'Member since',
    // MyProperties
    misPropiedadesTitle: 'My Properties', gestionaTus: 'Manage your listings and requests',
    nuevaPropiedad: 'New Property', publicadas: 'Published', misSolicitudes: 'My Requests',
    noPublicadas: 'You have no published properties', enviaUna: 'Submit a request and the admin will review it',
    publicarPropiedad: 'Publish property', noSolicitudes: 'You have no submitted requests',
    cuandoEnvies: 'When you submit a property for review it will appear here',
    enviarSolicitud: 'Submit request', enviado: 'Submitted:',
    pendiente: 'Pending', aprobado: 'Approved', rechazado: 'Rejected',
    motivo: 'Reason:', ver: 'View', eliminar: 'Delete',
    // Settings
    configuracionTitle: 'Account Settings',
    configuracionDesc: 'Manage your security, preferences and privacy',
    seguridad: 'Security', preferencias: 'Preferences', privacidad: 'Privacy',
    cambiarPassword: 'Change password', passwordActual: 'Current password',
    passwordNuevo: 'New password', confirmarNuevo: 'Confirm new password',
    actualizarPassword: 'Update password', actualizando: 'Updating...',
    verificacion2fa: 'Two-factor authentication',
    verificacion2faDesc: 'Add an extra layer of security to your account.',
    activar2fa: 'Enable two-factor authentication',
    dispositivosConectados: 'Connected devices', cerrarTodas: 'Close all',
    noSesiones: 'No active sessions registered.',
    ultimaActividad: 'Last activity:', cerrar: 'Close',
    idiomaLabel: 'Language', temaVisual: 'Visual theme',
    modoClaro: 'Light', modoOscuro: 'Dark',
    notificaciones: 'Notifications',
    notifEmail: 'Receive email notifications',
    notifApp: 'In-platform notifications',
    guardarPreferencias: 'Save preferences', guardando: 'Saving...',
    perfilPublico: 'Public profile', perfilPublicoDesc: 'Your profile will be visible to other users',
    permitirContacto: 'Allow contact', permitirContactoDesc: 'Other users can contact you from your listings',
    ocultarInfo: 'Hide personal information', ocultarInfoDesc: 'Hide phone and email in your listings',
    guardarPrivacidad: 'Save privacy',
    eliminarCuenta: 'Delete account',
    eliminarCuentaTitle: 'Delete account',
    eliminarCuentaDesc: 'This action is irreversible. Your account will be deactivated and cannot be recovered.',
    confirmaPassword: 'Confirm your password', cancelar: 'Cancel',
    eliminarMiCuenta: 'Delete my account', eliminando: 'Deleting...',
    passwordGuardada: 'Password updated successfully',
    configuracionGuardada: 'Settings saved',
  }
}

export const PreferencesProvider = ({ children }) => {
  const [tema, setTema] = useState('claro')
  const [idioma, setIdioma] = useState('es')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
  }, [tema])

  useEffect(() => {
    document.documentElement.setAttribute('lang', idioma)
  }, [idioma])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    axios.get('/api/configuracion')
      .then(res => {
        const c = res.data.configuracion
        if (c?.tema) setTema(c.tema)
        if (c?.idioma) setIdioma(c.idioma)
      })
      .catch(() => {})
  }, [])

  const t = (key) => translations[idioma]?.[key] ?? translations.es[key] ?? key
  const cambiarTema = (v) => setTema(v)
  const cambiarIdioma = (v) => setIdioma(v)

  return (
    <PreferencesContext.Provider value={{ tema, idioma, t, cambiarTema, cambiarIdioma }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export const usePreferences = () => {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences debe usarse dentro de PreferencesProvider')
  return ctx
}
