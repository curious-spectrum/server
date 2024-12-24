const jwt = require('jsonwebtoken');

// Replace this with your secret key
const JWT_SECRET = 'your-very-secret-key';
const JWT_EXPIRATION = '1h'; // Token expiration time (e.g., 1 hour)

const jwtUtil = {
  // Generate a JWT token
  generateToken: (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
  },

  // Verify a JWT token
  verifyToken: (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.error('JWT verification error:', error);
      return null;
    }
  }
};

module.exports = jwtUtil;
