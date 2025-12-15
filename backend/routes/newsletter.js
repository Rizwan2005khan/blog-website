import express from 'express';
import { authenticate, optionalAuth, authorizeAdmin } from '../middleware/auth.js';
import { cacheMiddleware } from '../middleware/cache.js';
import {
  validateSubscribe,
  validateSendCampaign,
  handleValidationErrors,
  validatePagination
} from '../middleware/validator.js';
import { newsletterLimiter } from '../middleware/rateLimit.js';
import {
  subscribe,
  verifySubscription,
  unsubscribe,
  getSubscribers,
  getSubscriberById,
  updateSubscriber,
  deleteSubscriber,
  sendCampaign,
  sendNewPostNotification,
  sendWeeklyDigest,
  getNewsletterAnalytics,
  exportSubscribersCSV,
  updatePreferences,
  getPreferences,
  importSubscribers,
  cleanupInactiveSubscribers,
  trackEmailOpen,
  trackEmailClick
} from '../controllers/newsletterController.js';

const router = express.Router();

// Public newsletter routes
router.post('/subscribe', newsletterLimiter, validateSubscribe, handleValidationErrors, subscribe);
router.get('/verify/:token', verifySubscription);
router.post('/unsubscribe/:token', unsubscribe);
router.get('/track/open/:subscriberId', trackEmailOpen);
router.get('/track/click/:subscriberId', trackEmailClick);
router.get('/preferences/:token', getPreferences);
router.put('/preferences', updatePreferences);

// Subscriber management (Admin)
router.get('/subscribers', authenticate, authorizeAdmin, validatePagination, getSubscribers);
router.get('/subscribers/:id', authenticate, authorizeAdmin, getSubscriberById);
router.put('/subscribers/:id', authenticate, authorizeAdmin, updateSubscriber);
router.delete('/subscribers/:id', authenticate, authorizeAdmin, deleteSubscriber);

// Campaign management (Admin)
router.post('/campaigns', authenticate, authorizeAdmin, validateSendCampaign, handleValidationErrors, sendCampaign);
router.post('/new-post/:postId', authenticate, authorizeAdmin, sendNewPostNotification);
router.post('/weekly-digest', authenticate, authorizeAdmin, sendWeeklyDigest);

// Analytics and tools (Admin)
router.get('/analytics', authenticate, authorizeAdmin, getNewsletterAnalytics);
router.get('/export/csv', authenticate, authorizeAdmin, exportSubscribersCSV);
router.post('/import', authenticate, authorizeAdmin, importSubscribers);
router.post('/cleanup', authenticate, authorizeAdmin, cleanupInactiveSubscribers);

export default router;