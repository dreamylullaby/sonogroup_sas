import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, parseApiError } from '../../config/api';
import '../../styles/pages/Messages.css';

const Messages = () => {
  const { user } = useAuth();
  const [propiedadesPendientes, setPropiedadesPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [showUserModal, setShowUserModal] = useState(null);

  const isAdmin = user?.rol === 'admin';

  useEffect(() => {
    cargarPropiedadesPendientes();
  }, [user]);

  const cargarPropiedadesPendientes = async () => {
    try {
      setLoading(true);
      
      const endpoint = isAdmin 
        ? '/api/propiedades-pendientes'
        : '/api/propiedades-pendientes/mis-propiedades';
      
      const response = await api.get(endpoint);
      setPropiedadesPendientes(response.data.propiedades || []);
      setError(null);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const aprobarPropiedad = async (id) => {
    if (!window.confirm('¿Estás seguro de aprobar esta propiedad?')) return;

    try {
      await api.put(`/api/propiedades-pendientes/${id}/aprobar`);
      alert('Propiedad aprobada y publicada exitosamente');
      cargarPropiedadesPendientes();
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  const rechazarPropiedad = async (id) => {
    if (!motivoRechazo.trim()) {
      alert('Por favor ingresa un motivo de rechazo');
      return;
    }

    try {
      await api.put(`/api/propiedades-pendientes/${id}/rechazar`, { motivo: motivoRechazo });
      alert('Propiedad rechazada');
      setShowRejectModal(null);
      setMotivoRechazo('');
      cargarPropiedadesPendientes();
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  const eliminarSolicitud = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta solicitud?')) return;

    try {
      await api.delete(`/api/propiedades-pendientes/${id}`);
      cargarPropiedadesPendientes();
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const parseCaracteristicas = (caracteristicas) => {
    if (!caracteristicas) return null;
    try {
      return typeof caracteristicas === 'string' ? JSON.parse(caracteristicas) : caracteristicas;
    } catch (e) {
      return null;
    }
  };

  const renderCaracteristica = (label, value) => {
    if (value === null || value === undefined || value === '') return null;
    
    if (typeof value === 'boolean') {
      return (
        <div className="detail-row" key={label}>
          <strong>{label}:</strong> {value ? 'Sí' : 'No'}
        </div>
      );
    }
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      return (
        <div key={label} className="nested-section">
          <h5>{label}:</h5>
          {Object.entries(value).map(([key, val]) => 
            renderCaracteristica(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), val)
          )}
        </div>
      );
    }
    
    return (
      <div className="detail-row" key={label}>
        <strong>{label}:</strong> {value}
      </div>
    );
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'pendiente': { class: 'badge-pending', text: 'Pendiente' },
      'aprobado': { class: 'badge-approved', text: 'Aprobado' },
      'rechazado': { class: 'badge-rejected', text: 'Rechazado' }
    };
    
    return badges[estado] || badges['pendiente'];
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  };

  if (loading) {
    return (
      <div className="messages-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando tus solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h1>{isAdmin ? 'Solicitudes de Publicación' : 'Mis Solicitudes de Publicación'}</h1>
        <p className="messages-subtitle">
          {isAdmin 
            ? 'Revisa y gestiona todas las solicitudes de publicación de propiedades'
            : 'Aquí puedes ver el estado de las propiedades que has enviado para aprobación'
          }
        </p>
      </div>

      {error && (
        <div className="error-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}

      {propiedadesPendientes.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <h2>No tienes solicitudes</h2>
          <p>Cuando publiques una propiedad, aparecerá aquí para su revisión</p>
        </div>
      ) : (
        <div className="messages-list">
          {propiedadesPendientes.map((propiedad) => {
            const badge = getEstadoBadge(propiedad.estado_aprobacion);
            const isExpanded = expandedId === propiedad.id_propiedad_pendiente;
            const caracteristicas = parseCaracteristicas(propiedad.caracteristicas);
            
            return (
              <div key={propiedad.id_propiedad_pendiente} className="message-card">
                <div className="message-card-header">
                  <div className="message-info">
                    <h3>{propiedad.titulo}</h3>
                    <span className={`status-badge ${badge.class}`}>
                      {badge.text}
                    </span>
                  </div>
                  <div className="message-actions">
                    <button
                      className="btn-expand"
                      onClick={() => toggleExpand(propiedad.id_propiedad_pendiente)}
                      title={isExpanded ? 'Ver menos' : 'Ver más detalles'}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                    {!isAdmin && propiedad.estado_aprobacion === 'pendiente' && (
                      <button
                        className="btn-delete"
                        onClick={() => eliminarSolicitud(propiedad.id_propiedad_pendiente)}
                        title="Eliminar solicitud"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="message-card-body">
                  {isAdmin && propiedad.usuarios && (
                    <div className="user-info-header">
                      <div className="user-info">
                        <strong>Solicitante:</strong> {propiedad.usuarios.nombre}
                      </div>
                      <button 
                        className="btn-view-user"
                        onClick={() => setShowUserModal(propiedad)}
                        title="Ver información de contacto"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Ver Contacto
                      </button>
                    </div>
                  )}

                  <div className="property-details">
                    <div className="detail-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      </svg>
                      <span>{propiedad.tipo || 'N/A'}</span>
                    </div>
                    
                    <div className="detail-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                      <span className="price">{formatearPrecio(propiedad.precio)}</span>
                    </div>

                    <div className="detail-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>{propiedad.ubicacion}</span>
                    </div>

                    {propiedad.habitaciones && (
                      <div className="detail-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        </svg>
                        <span>{propiedad.habitaciones} hab.</span>
                      </div>
                    )}

                    {propiedad.banos && (
                      <div className="detail-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                        </svg>
                        <span>{propiedad.banos} baños</span>
                      </div>
                    )}

                    {propiedad.area && (
                      <div className="detail-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        </svg>
                        <span>{propiedad.area} m²</span>
                      </div>
                    )}
                  </div>

                  {propiedad.descripcion && (
                    <p className="property-description">{propiedad.descripcion}</p>
                  )}

                  {isExpanded && (
                    <div className="expanded-details">
                      <h4>Información Básica</h4>
                      
                      {propiedad.direccion && (
                        <div className="detail-row">
                          <strong>Dirección:</strong> {propiedad.direccion}
                        </div>
                      )}

                      {propiedad.estado && (
                        <div className="detail-row">
                          <strong>Estado:</strong> {propiedad.estado}
                        </div>
                      )}

                      {caracteristicas && (
                        <button 
                          className="btn-view-details"
                          onClick={() => setShowDetailsModal(propiedad)}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          Ver Características Completas
                        </button>
                      )}

                      {propiedad.imagen && (
                        <div className="imagen-section">
                          <strong>Imagen:</strong>
                          <img src={propiedad.imagen} alt={propiedad.titulo} className="property-image" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="message-footer">
                    <div className="date-info">
                      <span className="date-label">Enviado:</span>
                      <span className="date-value">{formatearFecha(propiedad.fecha_solicitud)}</span>
                    </div>
                    
                    {propiedad.fecha_revision && (
                      <div className="date-info">
                        <span className="date-label">Revisado:</span>
                        <span className="date-value">{formatearFecha(propiedad.fecha_revision)}</span>
                      </div>
                    )}
                  </div>

                  {propiedad.estado_aprobacion === 'aprobado' && (
                    <div className="success-message">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      {isAdmin ? 'Propiedad aprobada y publicada' : 'Tu propiedad ha sido aprobada y publicada'}
                    </div>
                  )}

                  {propiedad.estado_aprobacion === 'rechazado' && propiedad.motivo_rechazo && (
                    <div className="error-message-inline">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                      <div>
                        <strong>Motivo del rechazo:</strong>
                        <p>{propiedad.motivo_rechazo}</p>
                      </div>
                    </div>
                  )}

                  {isAdmin && propiedad.estado_aprobacion === 'pendiente' && (
                    <div className="admin-actions">
                      <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
                        Debug: isAdmin={String(isAdmin)}, estado={propiedad.estado_aprobacion}
                      </p>
                      <button
                        className="btn-approve"
                        onClick={() => aprobarPropiedad(propiedad.id_propiedad_pendiente)}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Aprobar y Publicar
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => setShowRejectModal(propiedad.id_propiedad_pendiente)}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Rechazar Propiedad</h3>
            <p>Por favor, indica el motivo del rechazo:</p>
            <textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Escribe el motivo del rechazo..."
              rows="4"
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => {
                setShowRejectModal(null);
                setMotivoRechazo('');
              }}>
                Cancelar
              </button>
              <button className="btn-confirm-reject" onClick={() => rechazarPropiedad(showRejectModal)}>
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(null)}>
          <div className="modal-content modal-details" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Características Completas</h3>
              <button className="btn-close-modal" onClick={() => setShowDetailsModal(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="property-title-modal">
                <h4>{showDetailsModal.titulo}</h4>
                <p className="price-modal">{formatearPrecio(showDetailsModal.precio)}</p>
              </div>

              {showDetailsModal.descripcion && (
                <div className="section-modal">
                  <h5>Descripción</h5>
                  <p>{showDetailsModal.descripcion}</p>
                </div>
              )}

              {showDetailsModal.direccion && (
                <div className="section-modal">
                  <h5>Ubicación</h5>
                  <div className="detail-row">
                    <strong>Dirección:</strong> {showDetailsModal.direccion}
                  </div>
                  <div className="detail-row">
                    <strong>Ubicación:</strong> {showDetailsModal.ubicacion}
                  </div>
                </div>
              )}

              {(() => {
                const caract = parseCaracteristicas(showDetailsModal.caracteristicas);
                if (!caract) return null;

                return (
                  <>
                    {caract.tipo_operacion && (
                      <div className="section-modal">
                        <h5>Información General</h5>
                        {renderCaracteristica('Tipo de Operación', caract.tipo_operacion)}
                        {renderCaracteristica('Zona', caract.zona)}
                        {renderCaracteristica('Estrato', caract.estrato)}
                        {renderCaracteristica('Estado de Conservación', caract.estado_conservacion)}
                      </div>
                    )}

                    {caract.ubicacion_completa && (
                      <div className="section-modal">
                        <h5>Ubicación Completa</h5>
                        {Object.entries(caract.ubicacion_completa).map(([key, value]) => 
                          renderCaracteristica(
                            key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
                            value
                          )
                        )}
                      </div>
                    )}

                    {caract.servicios && (
                      <div className="section-modal">
                        <h5>Servicios Públicos</h5>
                        <div className="services-grid">
                          {Object.entries(caract.servicios).map(([key, value]) => (
                            <div key={key} className="service-item">
                              <span className={`service-indicator ${value ? 'active' : 'inactive'}`}>
                                {value ? '✓' : '✗'}
                              </span>
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {caract.caracteristicas_especificas && (
                      <div className="section-modal">
                        <h5>Características Específicas del {showDetailsModal.tipo}</h5>
                        {Object.entries(caract.caracteristicas_especificas).map(([key, value]) => 
                          renderCaracteristica(
                            key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
                            value
                          )
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

              {showDetailsModal.imagen && (
                <div className="section-modal">
                  <h5>Imagen de la Propiedad</h5>
                  <img src={showDetailsModal.imagen} alt={showDetailsModal.titulo} className="property-image-modal" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showUserModal && showUserModal.usuarios && (
        <div className="modal-overlay" onClick={() => setShowUserModal(null)}>
          <div className="modal-content modal-user" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Información del Solicitante</h3>
              <button className="btn-close-modal" onClick={() => setShowUserModal(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="user-avatar">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>

              <div className="user-details">
                <div className="user-detail-item">
                  <div className="detail-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className="detail-content">
                    <span className="detail-label">Nombre</span>
                    <span className="detail-value">{showUserModal.usuarios.nombre}</span>
                  </div>
                </div>

                <div className="user-detail-item">
                  <div className="detail-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <div className="detail-content">
                    <span className="detail-label">Correo Electrónico</span>
                    <a href={`mailto:${showUserModal.usuarios.email}`} className="detail-value detail-link">
                      {showUserModal.usuarios.email}
                    </a>
                  </div>
                </div>

                {showUserModal.usuarios.telefono && (
                  <div className="user-detail-item">
                    <div className="detail-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </div>
                    <div className="detail-content">
                      <span className="detail-label">Teléfono</span>
                      <a href={`tel:${showUserModal.usuarios.telefono}`} className="detail-value detail-link">
                        {showUserModal.usuarios.telefono}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="user-actions-modal">
                <a 
                  href={`mailto:${showUserModal.usuarios.email}`}
                  className="btn-contact-email"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  Enviar Correo
                </a>
                {showUserModal.usuarios.telefono && (
                  <a 
                    href={`tel:${showUserModal.usuarios.telefono}`}
                    className="btn-contact-phone"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    Llamar
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;


