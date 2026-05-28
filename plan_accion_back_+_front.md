**Plan de Acción Frontend v3.4

Objetivo

Sincronizar todos los formularios y flujos del frontend con los contratos reales del backend v3.4 y rediseñar la experiencia visual/UX de formularios para que sea clara, consistente y tolerante a errores.


Fase 2: Validación formal y manejo de errores





Incorporar librerías de validación (Zod) y formularios (react-hook-form + resolver Zod) para estandarizar reglas por flujo.



Definir schemas por dominio (auth, contacto, inmueble por tipo) en src/validation/* y aplicarlos en Login/Register/PublishProperty/Contact/UserModal.



Estandarizar traducción de errores backend (400/401/403/404/500 + errores SQL comunes) en un parser central y presentar mensajes amigables de campo/global.



Integrar toasts y patrones de feedback de éxito/error/loading en todas las acciones críticas.

Fase 3: Rediseño UI/UX amplio (formularios)





Crear sistema visual unificado de formularios (inputs, selects, radios, checkboxes, helper text, errores, estados disabled/loading) reutilizable en src/components/ui/*.



Rediseñar layout de formularios largos (publicar/editar) con mejor jerarquía visual, agrupación por secciones, barra de progreso de pasos y navegación entre pasos más clara.



Mejorar accesibilidad: foco en primer error, aria-invalid, aria-describedby, mensajes aria-live, contraste y tamaños táctiles.



Unificar estilo visual entre páginas de formulario en frontend/src/pages/PublishProperty.css, frontend/src/pages/Register.css, frontend/src/pages/Login.css, frontend/src/pages/Contact.css y componentes de apoyo.

Fase 4: Compatibilidad funcional por flujos críticos





Validar y ajustar flujo de publicación por rol (usuario normal crea solicitud; admin publica directo) en frontend/src/pages/PublishProperty.jsx y frontend/src/pages/MyProperties.jsx.



Confirmar flujos de favoritos y contacto con mensajes/estados consistentes en frontend/src/pages/Favorites.jsx y frontend/src/pages/PropertyDetail.jsx.



Asegurar que listados/filtros usan enums válidos y no permiten combinaciones inválidas en frontend/src/pages/Properties.jsx y frontend/src/components/PropertyFilters.jsx.

Fase 5: QA funcional y visual





Ejecutar smoke tests frontend+backend con checklist de rutas y payloads críticos.



Probar casos de error intencionales (enum inválido, campos faltantes, auth expirada) y verificar UX final.



Ajustar detalles CSS responsivos y consistencia visual final.

Arquitectura propuesta (alto nivel)

flowchart TD
  uiForms[FormPagesAndModals] --> formEngine[ReactHookFormPlusZod]
  formEngine --> payloadMapper[PayloadMapperByDomain]
  payloadMapper --> apiClient[AxiosApiClient]
  apiClient --> backendRoutes[BackendRoutesV34]
  backendRoutes --> errorAdapter[ErrorAdapter]
  errorAdapter --> uiFeedback[InlineErrorsAndToasts]
  designSystem[FormDesignSystemCSS] --> uiForms

Riesgos y mitigación





Riesgo: cambios extensos rompan comportamiento existente de formularios.





Mitigación: migración por flujo, feature flags visuales y pruebas por etapas.



Riesgo: divergencia entre enums UI y BD en tipos específicos.





Mitigación: catálogo único de enums derivado de v3.4 y validación Zod estricta.



Riesgo: rediseño visual impacte usabilidad en móvil.





Mitigación: QA responsive temprano por breakpoints principales.

Entregables





Frontend alineado con contratos backend v3.4 en flujos auth/inmuebles/contacto/favoritos/admin.



Sistema de validación robusto con mensajes de error de campo y globales.



Rediseño UI/UX amplio de formularios con CSS consistente y accesible.



Smoke tests funcionales documentados.

**