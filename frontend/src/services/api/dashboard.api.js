// src/services/api/dashboard.api.js
import API from './api.js';

export const dashboardAPI = {
  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await API.get('/admin/dashboard/stats');
    return response.data;
  },

  // Get recent activity
  getRecentActivity: async (limit = 10) => {
    const response = await API.get('/admin/dashboard/activity', { 
      params: { limit } 
    });
    return response.data;
  },

  // Get system status
  getSystemStatus: async () => {
    const response = await API.get('/admin/dashboard/system-status');
    return response.data;
  }
};