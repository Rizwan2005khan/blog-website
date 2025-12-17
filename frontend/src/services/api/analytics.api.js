// src/services/api/analytics.api.js
import API from './api.js';

export const analyticsAPI = {
  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await API.get('/analytics/dashboard');
    return response.data;
  },

  // Get traffic analytics
  getTrafficAnalytics: async (timeRange = '7d') => {
    const response = await API.get('/analytics/traffic', { 
      params: { timeRange } 
    });
    return response.data;
  },

  // Get content analytics
  getContentAnalytics: async (timeRange = '7d') => {
    const response = await API.get('/analytics/content', { 
      params: { timeRange } 
    });
    return response.data;
  },

  // Get user analytics
  getUserAnalytics: async (timeRange = '7d') => {
    const response = await API.get('/analytics/users', { 
      params: { timeRange } 
    });
    return response.data;
  },

  // Get engagement analytics
  getEngagementAnalytics: async (timeRange = '7d') => {
    const response = await API.get('/analytics/engagement', { 
      params: { timeRange } 
    });
    return response.data;
  },

  // Get popular content
  getPopularContent: async (type = 'posts', limit = 10) => {
    const response = await API.get('/analytics/popular', { 
      params: { type, limit } 
    });
    return response.data;
  },

  // Get traffic sources
  getTrafficSources: async (timeRange = '7d') => {
    const response = await API.get('/analytics/sources', { 
      params: { timeRange } 
    });
    return response.data;
  },

  // Export analytics data
  exportAnalytics: async (format = 'json', timeRange = '7d') => {
    const response = await API.get('/analytics/export', { 
      params: { format, timeRange },
      responseType: format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  }
};