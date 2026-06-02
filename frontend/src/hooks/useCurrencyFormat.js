import { useState, useCallback } from 'react'

const formatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0
})

/**
 * Formats a raw numeric value as Colombian pesos (COP).
 * Returns null for empty/zero values (show placeholder instead).
 */
export function formatCOP(value) {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (!num || num === 0) return ''
  return formatter.format(num)
}

/**
 * Strips non-numeric characters from a string, returning the raw numeric string.
 */
export function parseCurrencyInput(input) {
  if (input == null) return ''
  const stripped = String(input).replace(/[^0-9]/g, '')
  return stripped
}

/**
 * Hook for currency field formatting.
 * - Formats on blur using COP formatter
 * - Shows raw value on focus
 * - Strips non-numeric characters on change
 * - Shows placeholder (empty string) instead of $0 for empty/zero
 *
 * @param {string|number} rawValue - The current raw numeric value from form state
 * @param {Function} onChange - Callback to update the raw value in form state
 * @returns {{ displayValue: string, isFocused: boolean, handleFocus: Function, handleBlur: Function, handleChange: Function }}
 */
export function useCurrencyFormat(rawValue, onChange) {
  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
  }, [])

  const handleChange = useCallback((e) => {
    const raw = parseCurrencyInput(e.target.value)
    onChange(raw)
    return raw
  }, [onChange])

  // Compute display value
  let displayValue
  if (isFocused) {
    // Show raw numeric value when focused (for editing)
    const num = typeof rawValue === 'string' ? rawValue : String(rawValue || '')
    displayValue = num === '0' ? '' : num
  } else {
    // Show formatted value when blurred
    displayValue = formatCOP(rawValue)
  }

  return {
    displayValue,
    isFocused,
    handleFocus,
    handleBlur,
    handleChange
  }
}
