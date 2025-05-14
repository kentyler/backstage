/**
 * Schema configuration settings
 */

// Default schema to use when no other schema can be determined
export function getDefaultSchema() {
  return process.env.DEFAULT_SCHEMA || 'dev';
}
