/**
 * Botón con estado de carga
 */
const LoadingButton = ({
  loading = false,
  disabled = false,
  children,
  loadingText = 'Procesando...',
  className = '',
  type = 'submit',
  ...props
}) => {
  return (
    <button
      type={type}
      className={`${className} ${loading ? 'btn-loading' : ''}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="btn-spinner" aria-hidden="true"></span>
          {loadingText}
        </>
      ) : children}
    </button>
  )
}

export default LoadingButton
