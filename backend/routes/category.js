import express from 'express';
import { authenticate, optionalAuth, authorizeAdmin } from '../middleware/auth.js';
import { cacheMiddleware, clearCacheMiddleware } from '../middleware/cache.js';
import { validateCreateCategory, handleValidationErrors, validatePagination } from '../middleware/validator.js';
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
  getCategoryPosts,
  reorderCategories,
  mergeCategories,
  getCategoryAnalytics,
  exportCategoriesCSV
} from '../controllers/categoryController.js';

const router = express.Router();

// Public routes with caching
router.get('/', cacheMiddleware(600), getCategories);
router.get('/tree', cacheMiddleware(600), getCategoryTree);
router.get('/:slug', optionalAuth, cacheMiddleware(900), getCategoryBySlug);
router.get('/:id/posts', cacheMiddleware(300), getCategoryPosts);

// Admin routes
router.post('/', authenticate, authorizeAdmin, validateCreateCategory, handleValidationErrors, clearCacheMiddleware, createCategory);
router.put('/:id', authenticate, authorizeAdmin, validateCreateCategory, handleValidationErrors, clearCacheMiddleware, updateCategory);
router.delete('/:id', authenticate, authorizeAdmin, clearCacheMiddleware, deleteCategory);
router.post('/reorder', authenticate, authorizeAdmin, reorderCategories);
router.post('/merge', authenticate, authorizeAdmin, mergeCategories);
router.get('/admin/analytics', authenticate, authorizeAdmin, getCategoryAnalytics);
router.get('/admin/export/csv', authenticate, authorizeAdmin, exportCategoriesCSV);

export default router;