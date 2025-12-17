// src/services/api/users.api.js
import API from './api.js';

export const usersAPI = {
  // Get user profile (public)
  getUserProfile: async (userId) => {
    const response = await API.get(`/users/${userId}`);
    return response.data;
  },

  // Get user by username (public)
  getUserByUsername: async (username) => {
    const response = await API.get(`/users/username/${username}`);
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await API.put('/users/profile', userData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await API.put('/users/change-password', passwordData);
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (formData) => {
    const response = await API.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete avatar
  deleteAvatar: async () => {
    const response = await API.delete('/users/avatar');
    return response.data;
  },

  // Admin endpoints
  getAdminUsers: async (params = {}) => {
    const response = await API.get('/admin/users', { params });
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await API.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await API.delete(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (userId, status) => {
    const response = await API.put(`/admin/users/${userId}/status`, { status });
    return response.data;
  },

  getUserStats: async () => {
    const response = await API.get('/admin/users/stats');
    return response.data;
  }
};