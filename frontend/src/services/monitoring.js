// src/services/monitoring.js
import { monitoringAPI } from './api/monitoring.api.js';

const monitoringService = {
  getSystemStatus: monitoringAPI.getSystemStatus,
  getPerformanceMetrics: monitoringAPI.getPerformanceMetrics,
  getSystemAlerts: monitoringAPI.getSystemAlerts,
  getServerMetrics: monitoringAPI.getServerMetrics,
  getDatabaseMetrics: monitoringAPI.getDatabaseMetrics,
  dismissAlert: monitoringAPI.dismissAlert
};

export default monitoringService;