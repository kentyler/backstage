// This loader helps Mocha work with ES modules
export async function resolve(specifier, context, nextResolve) {
  const { parentURL = null } = context;
  
  // Handle file extensions
  if (specifier.endsWith('.js') || specifier.endsWith('.mjs') || specifier.endsWith('.cjs')) {
    return nextResolve(specifier);
  }

  // Handle package imports
  if (specifier.startsWith('.')) {
    return nextResolve(`${specifier}.js`);
  }

  // Default behavior for other cases
  return nextResolve(specifier, context);
}

export function getFormat(url, context, defaultGetFormat) {
  // This assumes .js files are ES modules
  if (url.endsWith('.js')) {
    return { format: 'module' };
  }
  // Let Node.js handle all other URLs
  return defaultGetFormat(url, context, defaultGetFormat);
}
