/**
 * @file db/llm/utils/parsing.js
 * @description Utility functions for parsing LLM configuration data
 */

/**
 * Parses the additional_config field from the LLM configuration
 * @param {Object|string} config - The config object or string to parse
 * @returns {Object} The parsed configuration object
 */
export const parseAdditionalConfig = (config) => {
  if (!config) return {};
  
  // If it's already an object, return it
  if (typeof config !== 'string') return config;
  
  try {
    return JSON.parse(config);
  } catch (e) {
    console.error('Error parsing additional_config:', e);
    return {};
  }
};
