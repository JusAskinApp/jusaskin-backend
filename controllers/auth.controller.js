const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/jwt');
const { hashPassword, comparePassword } = require('../utils/hash');
const { sendOtpEmail } = require('../utils/email');

const prisma = new PrismaClient();

const register = async (req, res) => {
  const { name, email, password, type, expertise, experience, availability,interests } = req.body;

  
  const existingUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (existingUser) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const hashedPassword = await hashPassword(password);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiration = Date.now() + parseInt(process.env.OTP_EXPIRATION);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        type,
        verificationStatus: "Pending",
        interests: interests ? JSON.parse(interests) : null,
        profileDetails: { otp, otpExpiration },
      },
    });

    if (type === "Professional") {
      await prisma.professional.create({
        data: {
          userId: user.UserID, 
          expertise: expertise ? JSON.parse(expertise) : null, 
          experience: experience || "",
          availability: availability || null,
        },
      });
    }

    await sendOtpEmail(email, otp);

    res.status(201).json({ message: 'User created. OTP sent to email.' });
  } catch (error) {
    res.status(500).json({ error: 'User registration failed', details: error.message });
  }
};

  

// OTP Verification
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.profileDetails.otp !== otp || Date.now() > user.profileDetails.otpExpiration) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    await prisma.user.update({
      where: { email },
      data: { verificationStatus: 'Verified', profileDetails: null }
    });

    res.status(200).json({ message: 'User verified successfully' });
  } catch (error) {
    res.status(500).json({ error: 'OTP verification failed' });
  }
};

// Login with JWT
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.verificationStatus !== 'Verified' || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ userId: user.UserID, username: user.name });
    res.status(200).json({
        token,
        user: {
          id: user.UserID,
          name: user.name,
          email: user.email,
          type: user.type,
          verificationStatus: user.verificationStatus,
        },
      });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiration = Date.now() + parseInt(process.env.OTP_EXPIRATION);

    await prisma.user.update({
      where: { email },
      data: { profileDetails: { otp, otpExpiration } }
    });

    await sendOtpEmail(email, otp);
    res.status(200).json({ message: 'OTP sent for password reset' });
  } catch (error) {
    res.status(500).json({ error: 'Password reset request failed' });
  }
};

// Password Reset Confirmation
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.profileDetails.otp !== otp || Date.now() > user.profileDetails.otpExpiration) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, profileDetails: null }
    });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Password reset failed',  message: error.message });

  }
};

module.exports = { register, verifyOtp, login, requestPasswordReset, resetPassword };
