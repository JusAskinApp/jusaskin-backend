const jwt = require('jsonwebtoken');
// const { jwtSecret } = require('../config');
const jwtSecret = process.env.JWT_SECRET;


const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
  
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }
  
    const token = authHeader.split(' ')[1]; // "Bearer <token>"
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded; // Attach user info to request
      next();
    } catch (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
  };
  
  module.exports = authenticate;
