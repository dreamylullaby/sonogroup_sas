import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { getErrorCountMessage } from './StepErrorBanner'

/**
 * Feature: publish-form-validation-ux, Property 4: Error banner count accuracy
 * Validates: Requirements 4.2, 4.4
 *
 * For any set of validation errors in a step (count >= 1), the error banner
 * displays the exact count with correct singular/plural grammar:
 * "Hay 1 campo con error" when count === 1,
 * "Hay {n} campos con errores" otherwise.
 */
describe('StepErrorBanner - Property 4: Error banner count accuracy', () => {
  it('returns singular message when errorCount is 1', () => {
    const result = getErrorCountMessage(1)
    expect(result).toBe('Hay 1 campo con error')
  })

  it('returns correct plural message for any errorCount > 1', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 1000 }), (count) => {
        const result = getErrorCountMessage(count)
        expect(result).toBe(`Hay ${count} campos con errores`)
      }),
      { numRuns: 100 }
    )
  })

  it('uses correct singular/plural grammar for any positive errorCount', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (count) => {
        const result = getErrorCountMessage(count)

        // Always contains the exact count
        expect(result).toContain(`${count}`)

        // Singular vs plural grammar
        if (count === 1) {
          expect(result).toBe('Hay 1 campo con error')
          expect(result).not.toContain('errores')
        } else {
          expect(result).toBe(`Hay ${count} campos con errores`)
          expect(result).toContain('errores')
        }
      }),
      { numRuns: 100 }
    )
  })
})
