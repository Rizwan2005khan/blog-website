// src/services/api/backup.api.js
import API from './api.js';

export const backupAPI = {
  // Get backup history
  getBackupHistory: async () => {
    const response = await API.get('/admin/backups');
    return response.data;
  },

  // Create backup
  createBackup: async (backupData) => {
    const response = await API.post('/admin/backups', backupData);
    return response.data;
  },

  // Restore backup
  restoreBackup: async (backupId) => {
    const response = await API.post(`/admin/backups/${backupId}/restore`);
    return response.data;
  },

  // Delete backup
  deleteBackup: async (backupId) => {
    const response = await API.delete(`/admin/backups/${backupId}`);
    return response.data;
  },

  // Download backup
  downloadBackup: async (backupId) => {
    const response = await API.get(`/admin/backups/${backupId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }
};