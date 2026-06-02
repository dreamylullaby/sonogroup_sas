/**
 * Utility functions for filtering and normalizing country names.
 * Used by the CountryAutocomplete component.
 */

/**
 * Normalizes a string by removing diacritical marks and lowercasing.
 * @param {string} str
 * @returns {string}
 */
export function normalizeText(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Filters the country list by query, prioritizing "starts with" matches.
 * Returns at most maxResults items.
 * @param {string} query - User input
 * @param {string[]} countries - Full country list
 * @param {number} maxResults - Maximum results to return (default: 10)
 * @returns {string[]}
 */
export function filterCountries(query, countries, maxResults = 10) {
  if (!query || !query.trim()) {
    return [];
  }

  const normalizedQuery = normalizeText(query.trim());

  const startsWith = [];
  const contains = [];

  for (const country of countries) {
    const normalizedCountry = normalizeText(country);

    if (normalizedCountry.startsWith(normalizedQuery)) {
      startsWith.push(country);
    } else if (normalizedCountry.includes(normalizedQuery)) {
      contains.push(country);
    }
  }

  return [...startsWith, ...contains].slice(0, maxResults);
}
