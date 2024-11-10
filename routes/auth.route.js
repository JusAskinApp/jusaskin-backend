const express = require('express');
const {
  register,
  verifyOtp,
  login,
  requestPasswordReset,
  resetPassword,
} = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

module.exports = router;
