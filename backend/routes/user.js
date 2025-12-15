import express from 'express';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';
import { upload, processImage } from '../middleware/upload.js';
import {
  register,
  login,
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  enable2FA,
  verify2FA,
  disable2FA
} from '../controllers/userController.js';

const router = express.Router();

// --- Public routes ---
router.post('/register', register); // No auth
router.post('/login', login);       // No auth

// --- Protected routes ---
router.use(authenticate); // everything below requires JWT

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/avatar', upload.single('avatar'), processImage, updateAvatar);
router.put('/change-password', changePassword);

// 2FA routes
router.post('/2fa/enable', enable2FA);
router.post('/2fa/verify', verify2FA);
router.post('/2fa/disable', disable2FA);

// Admin routes
router.get('/stats', authorizeAdmin, getUsers); // optional: can have getUserStats
router.get('/', authorizeAdmin, getUsers);
router.get('/:id', authorizeAdmin, getUserById);
router.put('/:id', authorizeAdmin, updateUser);
router.delete('/:id', authorizeAdmin, deleteUser);

export default router;
