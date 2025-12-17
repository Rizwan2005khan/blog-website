// src/services/dashboard.js
import { dashboardAPI } from './api/dashboard.api.js';

const dashboardService = {
  getDashboardStats: dashboardAPI.getDashboardStats,
  getRecentActivity: dashboardAPI.getRecentActivity,
  getSystemStatus: dashboardAPI.getSystemStatus
};

export default dashboardService;