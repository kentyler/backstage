/**
 * Utilities for vector string conversion
 */

/**
 * Converts a vector array to a PostgreSQL array literal string
 * @param {Array} arr - Array to convert
 * @returns {string} - PostgreSQL array literal
 */
export function toVectorLiteral(arr) {
  return `[${arr.join(',')}]`;
}
