import { body, param, query, validationResult } from 'express-validator';

// User validation
export const validateRegister = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters')
];

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Post validation
export const validateCreatePost = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be less than 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  body('category')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'scheduled', 'archived'])
    .withMessage('Invalid post status'),
  body('excerpt')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Excerpt must be less than 500 characters'),
  body('metaTitle')
    .optional()
    .isLength({ max: 60 })
    .withMessage('Meta title must be less than 60 characters'),
  body('metaDescription')
    .optional()
    .isLength({ max: 160 })
    .withMessage('Meta description must be less than 160 characters')
];

// Category validation
export const validateCreateCategory = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category name is required and must be less than 50 characters'),
  body('slug')
    .optional()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('parent')
    .optional()
    .isMongoId()
    .withMessage('Parent must be a valid category ID'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

// Comment validation
export const validateCreateComment = [
  body('post')
    .isMongoId()
    .withMessage('Valid post ID is required'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Comment content is required and must be less than 5000 characters'),
  body('parent')
    .optional()
    .isMongoId()
    .withMessage('Parent comment must be a valid comment ID'),
  body('author.name')
    .if(body('author').exists())
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be less than 100 characters'),
  body('author.email')
    .if(body('author').exists())
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('author.website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL')
];

// Newsletter validation
export const validateSubscribe = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  body('preferences.frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Frequency must be daily, weekly, or monthly'),
  body('preferences.categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),
  body('preferences.tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

export const validateSendCampaign = [
  body('subject')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject is required and must be less than 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Content is required'),
  body('template')
    .optional()
    .isIn(['default', 'new-post', 'weekly-digest'])
    .withMessage('Invalid template'),
  body('recipients')
    .optional()
    .isIn(['all', 'verified', 'specific', 'categories', 'tags'])
    .withMessage('Invalid recipients type'),
  body('recipientIds')
    .optional()
    .isArray()
    .withMessage('Recipient IDs must be an array'),
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid date'),
  body('testEmail')
    .optional()
    .isEmail()
    .withMessage('Test email must be valid')
];

// Tag validation
export const validateCreateTag = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Tag name is required and must be less than 50 characters')
    .customSanitizer(value => value.toLowerCase()),
  body('slug')
    .optional()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

// Settings validation
export const validateUpdateSettings = [
  body('site.title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Site title must be less than 100 characters'),
  body('site.description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Site description must be less than 500 characters'),
  body('site.keywords')
    .optional()
    .isArray()
    .withMessage('Keywords must be an array'),
  body('site.url')
    .optional()
    .isURL()
    .withMessage('Site URL must be valid'),
  body('site.email')
    .optional()
    .isEmail()
    .withMessage('Site email must be valid'),
  body('seo.defaultMetaTitle')
    .optional()
    .isLength({ max: 60 })
    .withMessage('Meta title must be less than 60 characters'),
  body('seo.defaultMetaDescription')
    .optional()
    .isLength({ max: 160 })
    .withMessage('Meta description must be less than 160 characters'),
  body('comments.moderation')
    .optional()
    .isIn(['auto', 'manual'])
    .withMessage('Moderation must be either auto or manual'),
  body('newsletter.frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Newsletter frequency must be daily, weekly, or monthly'),
  body('appearance.postsPerPage')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Posts per page must be between 1 and 100'),
  body('security.loginAttempts')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Login attempts must be between 1 and 10'),
  body('performance.cacheDuration')
    .optional()
    .isInt({ min: 60, max: 86400 })
    .withMessage('Cache duration must be between 60 and 86400 seconds')
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'name', 'title', 'publishedDate', 'views'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc')
];

// Search validation
export const validateSearch = [
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid category ID'),
  query('tag')
    .optional()
    .isString()
    .withMessage('Tag must be a string'),
  query('author')
    .optional()
    .isMongoId()
    .withMessage('Author must be a valid user ID'),
  query('status')
    .optional()
    .isIn(['draft', 'published', 'scheduled', 'archived'])
    .withMessage('Invalid status filter'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
];

// File upload validation
export const validateFileUpload = [
  body('file')
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error('File is required');
      }
      return true;
    }),
  body('file.mimetype')
    .custom((value, { req }) => {
      if (!req.file.mimetype.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }
      return true;
    }),
  body('file.size')
    .custom((value, { req }) => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }
      return true;
    })
];

// Error handler for validation
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};