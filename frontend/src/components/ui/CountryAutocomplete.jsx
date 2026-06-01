import { useState, useRef, useEffect, useCallback, useId } from 'react'
import { COUNTRIES } from '../../data/countries'
import { filterCountries } from '../../utils/countryFilter'
import { getInputClassName } from './FieldWrapper'
import '../../styles/components/CountryAutocomplete.css'

/**
 * CountryAutocomplete — Accessible combobox/listbox for selecting a country.
 * Implements ARIA combobox pattern with keyboard navigation.
 *
 * @param {string} value - Current selected country value
 * @param {function} onChange - Callback when country is selected: (countryName: string) => void
 * @param {function} onBlur - Callback for blur event (validation trigger)
 * @param {boolean} disabled - Whether the field is disabled
 * @param {string} id - HTML id for the input (for label association)
 * @param {string} name - Field name
 * @param {string} className - Optional CSS class override for the input element
 * @param {string} placeholder - Placeholder text
 * @param {boolean} touched - Whether the field has been touched (for styling)
 * @param {string} error - Error message (for styling)
 */
const CountryAutocomplete = ({
  value = '',
  onChange,
  onBlur,
  disabled = false,
  id,
  name,
  className,
  placeholder = 'Escribe para buscar un país...',
  touched = false,
  error = '',
}) => {
  const [inputValue, setInputValue] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [filteredCountries, setFilteredCountries] = useState([])

  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const blurTimeoutRef = useRef(null)
  const listboxId = useId()

  // Sync inputValue when external value changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Update filtered results when input changes
  useEffect(() => {
    if (inputValue && isOpen) {
      const results = filterCountries(inputValue, COUNTRIES, 10)
      setFilteredCountries(results)
    } else if (!inputValue) {
      setFilteredCountries([])
    }
  }, [inputValue, isOpen])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current)
      }
    }
  }, [])

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setHighlightedIndex(-1)

    if (newValue.trim()) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
      onChange('')
    }
  }

  const handleSelect = useCallback((country) => {
    setInputValue(country)
    setIsOpen(false)
    setHighlightedIndex(-1)
    onChange(country)
  }, [onChange])

  const handleKeyDown = (e) => {
    if (disabled) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen && inputValue.trim()) {
          setIsOpen(true)
        } else if (isOpen && filteredCountries.length > 0) {
          setHighlightedIndex((prev) =>
            prev < filteredCountries.length - 1 ? prev + 1 : prev
          )
        }
        break

      case 'ArrowUp':
        e.preventDefault()
        if (isOpen && filteredCountries.length > 0) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        }
        break

      case 'Enter':
        e.preventDefault()
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredCountries.length) {
          handleSelect(filteredCountries[highlightedIndex])
        }
        break

      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setHighlightedIndex(-1)
        break

      default:
        break
    }
  }

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    if (inputValue.trim()) {
      setIsOpen(true)
    }
  }

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false)
      setHighlightedIndex(-1)
      if (onBlur) {
        onBlur()
      }
    }, 200)
  }

  const handleOptionClick = (country) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    handleSelect(country)
  }

  const getOptionId = (index) => `${listboxId}-option-${index}`

  const inputClasses = className || getInputClassName(touched, error)

  return (
    <div className="country-autocomplete" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={inputClasses}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          isOpen && highlightedIndex >= 0
            ? getOptionId(highlightedIndex)
            : undefined
        }
        autoComplete="off"
      />

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          className="country-autocomplete__dropdown"
          aria-label="Países"
        >
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country, index) => (
              <li
                key={country}
                id={getOptionId(index)}
                role="option"
                aria-selected={highlightedIndex === index}
                className={`country-autocomplete__option ${
                  highlightedIndex === index ? 'country-autocomplete__option--highlighted' : ''
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleOptionClick(country)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {country}
              </li>
            ))
          ) : (
            <li className="country-autocomplete__no-results" role="status">
              No se encontraron países
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

export default CountryAutocomplete
