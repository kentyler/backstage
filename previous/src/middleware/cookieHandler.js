import { isLocalhost } from '../utils/env.js';

export const setCookie = (token) => {
  return (req, res, next) => {
    console.log('Setting cookie in middleware:', {
      token: token.substring(0, 10) + '...',
      isLocalhost: isLocalhost(),
      secure: false,
      sameSite: 'None'
    });

    const cookieOptions = {
      httpOnly: true,
      secure: false,
      sameSite: 'None',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
      domain: 'localhost',
      secure: false
    };

    console.log('Cookie options:', cookieOptions);
    res.cookie('token', token, cookieOptions);
    
    // Log the headers being set
    console.log('Cookie set with options:', cookieOptions);
    
    next();
  };
};
