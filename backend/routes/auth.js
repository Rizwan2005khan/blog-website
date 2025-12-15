import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  googleLogin,
  refreshToken,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  logout
} from '../controllers/userController.js';
import {
  validateRegister,
  validateLogin,
  handleValidationErrors
} from '../middleware/validator.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Public routes
router.post('/register', authLimiter, validateRegister, handleValidationErrors, register);
router.post('/login', authLimiter, validateLogin, handleValidationErrors, login);
router.post('/google', authLimiter, googleLogin);
router.post('/refresh', refreshToken);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', authLimiter, resendVerificationEmail);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/logout', logout);

export default router;