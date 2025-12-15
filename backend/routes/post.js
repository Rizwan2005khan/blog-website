import express from 'express';
import { authenticate, optionalAuth, authorizeAuthor, authorizeOwnerOrAdmin } from '../middleware/auth.js';
import { upload, processImage } from '../middleware/upload.js';
import { cacheMiddleware, clearCacheMiddleware } from '../middleware/cache.js';
import {
  validateCreatePost,
  validateUpdateSettings,
  handleValidationErrors,
  validatePagination,
  validateSearch
} from '../middleware/validator.js';
import { postLimiter } from '../middleware/rateLimit.js';
import Post from '../models/Post.js';
import {
  getPublishedPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  getAdminPosts,
  toggleLike,
  toggleBookmark,
  getBookmarkedPosts,
  addComment,
  getPostComments,
  getPostsByAuthor,
  getPostsByCategory,
  getPostsByTag,
  searchPosts,
  getPostAnalytics,
  exportPostsCSV,
  bulkUpdateStatus,
  bulkDeletePosts,
  publishScheduledPosts
} from '../controllers/postController.js';

const router = express.Router();

// Public routes with caching
router.get('/', cacheMiddleware(300), validatePagination, validateSearch, getPublishedPosts);
router.get('/search', cacheMiddleware(300), validateSearch, searchPosts);
router.get('/author/:username', cacheMiddleware(300), validatePagination, getPostsByAuthor);
router.get('/category/:slug', cacheMiddleware(300), validatePagination, getPostsByCategory);
router.get('/tag/:slug', cacheMiddleware(300), validatePagination, getPostsByTag);
router.get('/:slug', optionalAuth, cacheMiddleware(600), getPostBySlug);

// Public engagement routes
router.post('/:id/like', authenticate, toggleLike);
router.post('/:id/bookmark', authenticate, toggleBookmark);
router.get('/bookmarks/me', authenticate, validatePagination, getBookmarkedPosts);

// Public comment routes
router.post('/:id/comments', authenticate, addComment);
router.get('/:id/comments', getPostComments);

// Admin routes
router.get('/admin/all', authenticate, authorizeAuthor, getAdminPosts);
router.post('/admin/bulk/status', authenticate, authorizeAuthor, bulkUpdateStatus);
router.post('/admin/bulk/delete', authenticate, authorizeAuthor, bulkDeletePosts);
router.post('/admin/scheduled/publish', authenticate, authorizeAuthor, publishScheduledPosts);
router.get('/admin/export/csv', authenticate, authorizeAuthor, exportPostsCSV);
router.get('/admin/analytics/:id', authenticate, authorizeOwnerOrAdmin(Post), getPostAnalytics);

// Protected CRUD routes
router.post('/', authenticate, authorizeAuthor, postLimiter, validateCreatePost, handleValidationErrors, clearCacheMiddleware, createPost);
router.put('/:id', authenticate, authorizeOwnerOrAdmin(Post), validateCreatePost, handleValidationErrors, clearCacheMiddleware, updatePost);
router.delete('/:id', authenticate, authorizeOwnerOrAdmin(Post), clearCacheMiddleware, deletePost);

export default router;