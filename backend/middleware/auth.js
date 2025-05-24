/**
 * Authentication middleware
 * Checks if the user is authenticated by verifying the presence of userId in the session
 */
export const auth = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  
  return res.status(401).json({ error: 'Not authenticated' });
};

export default auth;
