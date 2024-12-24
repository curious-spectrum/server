const jwtUtil = require('./jwt');

const jwtMiddleware = (req, res, next) => {
  console.log(req.headers)
  // Get the token from the Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token part after 'Bearer '
console.log(token)
  if (!token) {
    return res.status(401).json({ message: 'Authorization token required' ,notLoggedIn:true});
  }

  // Verify the token
  const user = jwtUtil.verifyToken(token);

  if (!user) {
    return res.status(403).json({ message: 'Invalid or expired token' ,notLoggedIn:true});
  }

  // Attach the user information to the request object for use in later routes
  req.user = user;
  
  next(); // Pass control to the next middleware or route handler
};

module.exports = jwtMiddleware;
