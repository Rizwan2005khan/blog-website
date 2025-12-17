// src/services/users.js
import { usersAPI } from './api/users.api.js';

const userService = {
  getUserProfile: usersAPI.getUserProfile,
  getUserByUsername: usersAPI.getUserByUsername,
  updateProfile: usersAPI.updateProfile,
  changePassword: usersAPI.changePassword,
  uploadAvatar: usersAPI.uploadAvatar,
  deleteAvatar: usersAPI.deleteAvatar,
  getAdminUsers: usersAPI.getAdminUsers,
  updateUser: usersAPI.updateUser,
  deleteUser: usersAPI.deleteUser,
  updateUserStatus: usersAPI.updateUserStatus,
  getUserStats: usersAPI.getUserStats
};

export default userService;