/**
 * Utilities for vector normalization
 */
import { VECTOR_DIM } from './constants.js';

/**
 * Normalizes a vector to ensure it matches the required dimension
 * @param {Array} arr - Array to normalize
 * @returns {Array} - Normalized array with correct dimensions
 */
export function normalizeVector(arr) {
  // If contentVector is null or undefined, return an empty array of the right dimension
  if (!arr) return new Array(VECTOR_DIM).fill(0);
  if (!Array.isArray(arr)) throw new TypeError('contentVector must be an array');
  if (arr.length === VECTOR_DIM) return arr;
  if (arr.length > VECTOR_DIM) return arr.slice(0, VECTOR_DIM);
  return arr.concat(new Array(VECTOR_DIM - arr.length).fill(0));
}
