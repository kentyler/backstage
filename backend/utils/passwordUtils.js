/**
 * @file utils/passwordUtils.js
 * @description Utility functions for password hashing and verification
 */

import bcrypt from 'bcrypt';

// Default salt rounds for bcrypt (higher is more secure but slower)
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * 
 * @param {string} password - The plain text password to hash
 * @returns {Promise<string>} - The hashed password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * 
 * @param {string} password - The plain text password to verify
 * @param {string} hash - The hash to verify against
 * @returns {Promise<boolean>} - True if the password matches, false otherwise
 */
export async function verifyPassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}
