/**
 * Utility that returns the correct Tailwind classes for an input
 * based on touched and error state.
 *
 * Exactly one of three style sets is applied:
 * - Error: touched === true && error is truthy
 * - Valid: touched === true && error is falsy
 * - Default: touched === false
 */
export function getInputClassName(touched, error) {
  const base =
    'transition-all duration-200 rounded-lg px-4 py-2.5 text-sm w-full'

  if (!touched) {
    return `${base} border-slate-200 bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400`
  }

  if (error) {
    return `${base} border-red-400 bg-red-50/60 focus:ring-2 focus:ring-red-200 focus:border-red-400`
  }

  return `${base} border-emerald-400 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400`
}

/**
 * FieldWrapper — wraps a form field with label, required asterisk,
 * conditional styling, error message, and "Correcto" indicator.
 */
const FieldWrapper = ({ label, name, required, error, touched, children }) => {
  const showError = touched && !!error
  const showValid = touched && !error

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={name}
          className="block uppercase text-xs font-medium text-slate-500 tracking-wide mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
          {showValid && (
            <span className="text-emerald-500 ml-2 normal-case text-xs">
              ✓ Correcto
            </span>
          )}
        </label>
      )}

      {children}

      {showError && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  )
}

export default FieldWrapper
