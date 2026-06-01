import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { formatCOP, parseCurrencyInput } from './useCurrencyFormat'

/**
 * Feature: publish-form-validation-ux, Property 6: Currency format round-trip
 * Validates: Requirements 6.1, 6.2, 6.3, 6.5
 *
 * For any valid positive integer value, formatting it with the COP formatter
 * then parsing the formatted string back to a number SHALL produce the original value.
 */
describe('useCurrencyFormat - Property 6: Currency format round-trip', () => {
  it('formatting then parsing produces the original value for any positive integer', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 999_999_999_999 }),
        (value) => {
          const formatted = formatCOP(value)
          // Formatted string should not be empty for positive values
          expect(formatted).not.toBe('')
          // Parse back: strip non-numeric chars to get raw number
          const parsed = parseCurrencyInput(formatted)
          expect(Number(parsed)).toBe(value)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('returns empty string for zero or empty values (placeholder behavior)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(0, '', null, undefined, '0'),
        (value) => {
          const formatted = formatCOP(value)
          expect(formatted).toBe('')
        }
      ),
      { numRuns: 100 }
    )
  })
})
