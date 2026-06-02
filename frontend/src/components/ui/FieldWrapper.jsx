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
    'transition-all duration-200 rounded-lg border px-4 py-3 text-base w-full bg-white text-slate-800 placeholder:text-slate-400 placeholder:text-sm'

  if (!touched) {
    return `${base} border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400`
  }

  if (error) {
    return `${base} border-red-400 bg-red-50/60 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400`
  }

  return `${base} border-emerald-400 bg-emerald-50/30 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400`
}

/**
 * FieldWrapper — wraps a form field with label, required asterisk,
 * conditional styling, error message, and "Correcto" indicator.
 */
const FieldWrapper = ({ label, name, required, error, touched, children }) => {
  const showError = touched && !!error
  const showValid = touched && !error

  return (
    <div className="mb-6">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-slate-600 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
          {showValid && (
            <span className="text-emerald-500 ml-2 text-sm font-normal">
              ✓ Correcto
            </span>
          )}
        </label>
      )}

      {children}

      {showError && (
        <p className="text-red-500 text-sm mt-1.5">{error}</p>
      )}
    </div>
  )
}

export default FieldWrapper
