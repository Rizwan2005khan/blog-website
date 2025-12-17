// src/services/settings.js
import { settingsAPI } from './api/settings.api.js';

const settingsService = {
  getSettings: settingsAPI.getSettings,
  updateSettings: settingsAPI.updateSettings,
  getSettingsSection: settingsAPI.getSettingsSection,
  updateSettingsSection: settingsAPI.updateSettingsSection
};

export default settingsService;