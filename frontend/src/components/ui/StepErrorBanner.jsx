/**
 * StepErrorBanner — displays a summary banner with the count of validation
 * errors in the current step. Hidden when errorCount is 0.
 */

/**
 * Returns the error count message with correct singular/plural grammar.
 * Exported for property-based testing.
 */
export function getErrorCountMessage(errorCount) {
  if (errorCount === 1) {
    return 'Hay 1 campo con error'
  }
  return `Hay ${errorCount} campos con errores`
}

const StepErrorBanner = ({ errorCount }) => {
  if (!errorCount || errorCount <= 0) {
    return null
  }

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4">
      <p className="font-medium">{getErrorCountMessage(errorCount)}</p>
      <p className="text-sm mt-1">Revisa los campos marcados en rojo antes de continuar.</p>
    </div>
  )
}

export default StepErrorBanner
