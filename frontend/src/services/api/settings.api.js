// src/services/api/settings.api.js
import API from './api.js';

export const settingsAPI = {
  // Get site settings
  getSettings: async () => {
    const response = await API.get('/settings');
    return response.data;
  },

  // Update site settings
  updateSettings: async (settingsData) => {
    const response = await API.put('/settings', settingsData);
    return response.data;
  },

  // Get specific section settings
  getSettingsSection: async (section) => {
    const response = await API.get(`/settings/${section}`);
    return response.data;
  },

  // Update specific section settings
  updateSettingsSection: async (section, data) => {
    const response = await API.put(`/settings/${section}`, data);
    return response.data;
  }
};