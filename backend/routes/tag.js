import express from 'express';
import { authenticate, optionalAuth, authorizeAdmin } from '../middleware/auth.js';
import { cacheMiddleware, clearCacheMiddleware } from '../middleware/cache.js';
import { validateCreateTag, handleValidationErrors, validatePagination } from '../middleware/validator.js';
import {
  getTags,
  getTagBySlug,
  createTag,
  updateTag,
  deleteTag,
  getTagPosts,
  mergeTags,
  getTagSuggestions,
  getTagAnalytics,
  exportTagsCSV,
  bulkUpdateStatus,
  bulkDeleteTags,
  autoSuggestTags
} from '../controllers/tagController.js';

const router = express.Router();

// Public routes with caching
router.get('/', cacheMiddleware(600), getTags);
router.get('/suggestions', getTagSuggestions);
router.get('/:slug', optionalAuth, cacheMiddleware(900), getTagBySlug);
router.get('/:id/posts', cacheMiddleware(300), getTagPosts);

// Admin routes
router.post('/', authenticate, authorizeAdmin, validateCreateTag, handleValidationErrors, clearCacheMiddleware, createTag);
router.put('/:id', authenticate, authorizeAdmin, validateCreateTag, handleValidationErrors, clearCacheMiddleware, updateTag);
router.delete('/:id', authenticate, authorizeAdmin, clearCacheMiddleware, deleteTag);
router.post('/merge', authenticate, authorizeAdmin, mergeTags);
router.post('/auto-suggest', authenticate, authorizeAdmin, autoSuggestTags);
router.get('/admin/analytics', authenticate, authorizeAdmin, getTagAnalytics);
router.get('/admin/export/csv', authenticate, authorizeAdmin, exportTagsCSV);
router.put('/admin/bulk/status', authenticate, authorizeAdmin, bulkUpdateStatus);
router.delete('/admin/bulk/delete', authenticate, authorizeAdmin, bulkDeleteTags);

export default router;