const jwt = require('jsonwebtoken');

// Function to generate token with user information
const generateToken = (user, expiresIn = process.env.JWT_EXPIRATION) => {
  const payload = {
    UserID: user.userId ,
    username: user.username
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

module.exports = { generateToken };
