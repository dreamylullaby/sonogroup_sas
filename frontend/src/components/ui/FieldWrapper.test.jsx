import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { getInputClassName } from './FieldWrapper'

/**
 * Feature: publish-form-validation-ux, Property 1: Conditional input styling is mutually exclusive
 * Validates: Requirements 1.3, 1.4, 1.5
 *
 * For any combination of touched (boolean) and error (string|null),
 * exactly one of the three style sets (error, valid, default) is applied.
 */
describe('FieldWrapper - Property 1: Conditional input styling is mutually exclusive', () => {
  const ERROR_CLASSES = ['border-red-400', 'bg-red-50/60', 'focus:ring-red-200', 'focus:border-red-400']
  const VALID_CLASSES = ['border-emerald-400', 'bg-emerald-50/30', 'focus:ring-emerald-200', 'focus:border-emerald-400']
  const DEFAULT_CLASSES = ['border-slate-200', 'bg-white', 'focus:ring-indigo-200', 'focus:border-indigo-400']
  const BASE_CLASSES = ['transition-all', 'duration-200', 'rounded-lg', 'px-4', 'py-2.5', 'text-sm', 'w-full']

  const errorArb = fc.oneof(
    fc.constant(null),
    fc.string({ minLength: 1, maxLength: 100 })
  )

  it('always includes base classes regardless of state', () => {
    fc.assert(
      fc.property(fc.boolean(), errorArb, (touched, error) => {
        const result = getInputClassName(touched, error)
        for (const cls of BASE_CLASSES) {
          expect(result).toContain(cls)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('applies exactly one style set based on touched/error state', () => {
    fc.assert(
      fc.property(fc.boolean(), errorArb, (touched, error) => {
        const result = getInputClassName(touched, error)

        const hasError = ERROR_CLASSES.every(cls => result.includes(cls))
        const hasValid = VALID_CLASSES.every(cls => result.includes(cls))
        const hasDefault = DEFAULT_CLASSES.every(cls => result.includes(cls))

        // Exactly one set is fully present
        const activeCount = [hasError, hasValid, hasDefault].filter(Boolean).length
        expect(activeCount).toBe(1)

        // Correct set is active based on state
        if (!touched) {
          expect(hasDefault).toBe(true)
        } else if (error) {
          expect(hasError).toBe(true)
        } else {
          expect(hasValid).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })
})
