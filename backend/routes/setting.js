import express from 'express';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';
import { upload, processImage } from '../middleware/upload.js';
import { validateUpdateSettings, handleValidationErrors } from '../middleware/validator.js';
import {
  getSettings,
  updateGeneralSettings,
  updateSEOSettings,
  updateSocialSettings,
  updateCommentSettings,
  updateNewsletterSettings,
  updateEmailSettings,
  updateAppearanceSettings,
  updateSecuritySettings,
  updatePerformanceSettings,
  updateBackupSettings,
  uploadLogo,
  uploadFavicon,
  resetSettings,
  getSystemStatus,
  toggleMaintenanceMode,
  exportSettings,
  importSettings,
  getEmailTemplates,
  updateEmailTemplate,
  testEmailConfiguration,
  getMaintenanceStatus
} from '../controllers/settingController.js';

const router = express.Router();

/* =========================
   🌍 PUBLIC ROUTES
========================= */

// Public maintenance status
router.get('/maintenance/status', getMaintenanceStatus);

// ✅ PUBLIC: frontend needs this (Header, Footer, SEO)
router.get('/', getSettings);

/* =========================
   🔒 ADMIN ROUTES
========================= */
router.use(authenticate, authorizeAdmin);

// Update sections
router.put('/general', validateUpdateSettings, handleValidationErrors, updateGeneralSettings);
router.put('/seo', validateUpdateSettings, handleValidationErrors, updateSEOSettings);
router.put('/social', validateUpdateSettings, handleValidationErrors, updateSocialSettings);
router.put('/comments', validateUpdateSettings, handleValidationErrors, updateCommentSettings);
router.put('/newsletter', validateUpdateSettings, handleValidationErrors, updateNewsletterSettings);
router.put('/email', validateUpdateSettings, handleValidationErrors, updateEmailSettings);
router.put('/appearance', validateUpdateSettings, handleValidationErrors, updateAppearanceSettings);
router.put('/security', validateUpdateSettings, handleValidationErrors, updateSecuritySettings);
router.put('/performance', validateUpdateSettings, handleValidationErrors, updatePerformanceSettings);
router.put('/backup', validateUpdateSettings, handleValidationErrors, updateBackupSettings);

// Uploads
router.post('/upload/logo', upload.single('logo'), processImage, uploadLogo);
router.post('/upload/favicon', upload.single('favicon'), processImage, uploadFavicon);

// Utilities
router.post('/reset', resetSettings);
router.post('/maintenance', toggleMaintenanceMode);
router.post('/test-email', testEmailConfiguration);
router.get('/system-status', getSystemStatus);
router.get('/export', exportSettings);
router.post('/import', importSettings);
router.get('/email-templates', getEmailTemplates);
router.put('/email-templates/:template', updateEmailTemplate);

export default router;
