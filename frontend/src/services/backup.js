// src/services/backup.js
import { backupAPI } from './api/backup.api.js';

const backupService = {
  getBackupHistory: backupAPI.getBackupHistory,
  createBackup: backupAPI.createBackup,
  restoreBackup: backupAPI.restoreBackup,
  deleteBackup: backupAPI.deleteBackup,
  downloadBackup: backupAPI.downloadBackup
};

export default backupService;