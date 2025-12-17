// src/services/auth.js
import { authAPI } from './api/auth.api.js';

const authService = {
  login: authAPI.login,
  register: authAPI.register,
  getCurrentUser: authAPI.getCurrentUser,
  refreshToken: authAPI.refreshToken,
  logout: authAPI.logout,
  forgotPassword: authAPI.forgotPassword,
  resetPassword: authAPI.resetPassword,
  verifyEmail: authAPI.verifyEmail,
  resendVerificationEmail: authAPI.resendVerificationEmail
};

export default authService;