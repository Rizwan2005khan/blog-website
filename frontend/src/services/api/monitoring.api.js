// src/services/api/monitoring.api.js
import API from './api.js';

export const monitoringAPI = {
  // Get system status
  getSystemStatus: async () => {
    const response = await API.get('/admin/monitoring/status');
    return response.data;
  },

  // Get performance metrics
  getPerformanceMetrics: async (timeRange = '1h') => {
    const response = await API.get('/admin/monitoring/performance', { 
      params: { timeRange } 
    });
    return response.data;
  },

  // Get system alerts
  getSystemAlerts: async () => {
    const response = await API.get('/admin/monitoring/alerts');
    return response.data;
  },

  // Get server metrics
  getServerMetrics: async () => {
    const response = await API.get('/admin/monitoring/server');
    return response.data;
  },

  // Get database metrics
  getDatabaseMetrics: async () => {
    const response = await API.get('/admin/monitoring/database');
    return response.data;
  },

  // Dismiss alert
  dismissAlert: async (alertId) => {
    const response = await API.post(`/admin/monitoring/alerts/${alertId}/dismiss`);
    return response.data;
  }
};