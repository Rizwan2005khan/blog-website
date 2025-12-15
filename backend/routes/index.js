import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './user.js';
import postRoutes from './post.js';
import categoryRoutes from './category.js';
import commentRoutes from './comment.js';
import tagRoutes from './tag.js';
import newsletterRoutes from './newsletter.js';
import settingsRoutes from './setting.js';
import uploadRoutes from './upload.js';

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation route
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'API Documentation',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      posts: '/api/posts',
      categories: '/api/categories',
      comments: '/api/comments',
      tags: '/api/tags',
      newsletter: '/api/newsletter',
      settings: '/api/settings',
      upload: '/api/upload'
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/categories', categoryRoutes);
router.use('/comments', commentRoutes);
router.use('/tags', tagRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/settings', settingsRoutes);
router.use('/upload', uploadRoutes);

export default router;