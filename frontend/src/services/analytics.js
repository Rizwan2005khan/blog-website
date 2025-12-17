// src/services/analytics.js
import { analyticsAPI } from './api/analytics.api.js';

const analyticsService = {
  getDashboardStats: analyticsAPI.getDashboardStats,
  getTrafficAnalytics: analyticsAPI.getTrafficAnalytics,
  getContentAnalytics: analyticsAPI.getContentAnalytics,
  getUserAnalytics: analyticsAPI.getUserAnalytics,
  getEngagementAnalytics: analyticsAPI.getEngagementAnalytics,
  getPopularContent: analyticsAPI.getPopularContent,
  getTrafficSources: analyticsAPI.getTrafficSources,
  exportAnalytics: analyticsAPI.exportAnalytics
};

export default analyticsService;