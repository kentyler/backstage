/**
 * Middleware to verify that clientPool is available
 * Used after setClientPool middleware to ensure database access is available
 */
export const requireClientPool = (req, res, next) => {
  if (!req.clientPool) {
    console.error('No clientPool found in request object');
    return res.status(500).json({ error: 'Database connection error' });
  }
  next();
};

export default requireClientPool;
