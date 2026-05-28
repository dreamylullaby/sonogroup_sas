/**
 * Componente reutilizable de campo de formulario
 * Maneja label, input, error, helper text, y estados
 */
const FormField = ({
  label,
  name,
  type = 'text',
  error,
  helperText,
  required,
  disabled,
  children,
  className = '',
  ...inputProps
}) => {
  const hasError = !!error
  const fieldId = `field-${name}`
  const errorId = `${name}-error`
  const helperId = `${name}-helper`

  const describedBy = [
    hasError ? errorId : null,
    helperText ? helperId : null
  ].filter(Boolean).join(' ') || undefined

  return (
    <div className={`form-group ${hasError ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={fieldId}>
          {label} {required && <span className="required-mark">*</span>}
        </label>
      )}

      {children || (
        type === 'textarea' ? (
          <textarea
            id={fieldId}
            name={name}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            aria-required={required}
            {...inputProps}
          />
        ) : type === 'select' ? (
          <select
            id={fieldId}
            name={name}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            aria-required={required}
            {...inputProps}
          >
            {inputProps.options?.map(opt => {
              const val = typeof opt === 'object' ? opt.value : opt
              const lbl = typeof opt === 'object' ? opt.label : opt
              return <option key={val} value={val}>{lbl}</option>
            })}
          </select>
        ) : (
          <input
            id={fieldId}
            name={name}
            type={type}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            aria-required={required}
            {...inputProps}
          />
        )
      )}

      {hasError && (
        <small id={errorId} className="field-error" role="alert">
          {error}
        </small>
      )}

      {helperText && !hasError && (
        <small id={helperId} className="field-helper">
          {helperText}
        </small>
      )}
    </div>
  )
}

export default FormField
