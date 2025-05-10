export const isLocalhost = () => {
  return process.env.NODE_ENV !== 'production' && 
         (process.env.HOST === 'localhost' || 
          process.env.HOSTNAME === 'localhost' ||
          !process.env.HOST); // Default to assuming localhost in development
};
