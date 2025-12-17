// src/services/utils/constants.js
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me'
  },
  POSTS: {
    LIST: '/posts',
    DETAIL: '/posts/:id',
    CREATE: '/posts',
    UPDATE: '/posts/:id',
    DELETE: '/posts/:id',
    BY_CATEGORY: '/posts/category/:slug',
    BY_TAG: '/posts/tag/:slug',
    SEARCH: '/posts/search'
  },
  CATEGORIES: {
    LIST: '/categories',
    DETAIL: '/categories/:id',
    CREATE: '/admin/categories',
    UPDATE: '/admin/categories/:id',
    DELETE: '/admin/categories/:id'
  },
  COMMENTS: {
    LIST: '/comments',
    CREATE: '/comments',
    UPDATE: '/comments/:id',
    DELETE: '/comments/:id',
    MODERATE: '/admin/comments'
  },
  USERS: {
    PROFILE: '/users/:id',
    UPDATE: '/users/:id',
    ADMIN_LIST: '/admin/users'
  },
  NEWSLETTER: {
    SUBSCRIBE: '/newsletter/subscribe',
    UNSUBSCRIBE: '/newsletter/unsubscribe',
    CAMPAIGNS: '/admin/newsletter/campaigns'
  },
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    TRAFFIC: '/analytics/traffic',
    CONTENT: '/analytics/content'
  },
  SETTINGS: {
    GENERAL: '/settings',
    UPDATE: '/settings/:section'
  },
  BACKUP: {
    LIST: '/admin/backups',
    CREATE: '/admin/backups',
    RESTORE: '/admin/backups/:id/restore'
  },
  MONITORING: {
    STATUS: '/admin/monitoring/status',
    METRICS: '/admin/monitoring/metrics',
    ALERTS: '/admin/monitoring/alerts'
  }
};

export const RESPONSE_MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  ERROR: 'An error occurred',
  UNAUTHORIZED: 'Please login to continue',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Please check your input and try again',
  SERVER_ERROR: 'Server error. Please try again later'
};

export const QUERY_KEYS = {
  AUTH: {
    USER: 'user',
    TOKEN: 'token'
  },
  POSTS: {
    LIST: 'posts',
    DETAIL: 'post',
    ADMIN_LIST: 'admin-posts'
  },
  CATEGORIES: {
    LIST: 'categories',
    DETAIL: 'category',
    ADMIN_LIST: 'admin-categories'
  },
  COMMENTS: {
    LIST: 'comments',
    MODERATION: 'moderation-comments'
  },
  USERS: {
    LIST: 'users',
    ADMIN_LIST: 'admin-users'
  },
  NEWSLETTER: {
    SUBSCRIBERS: 'newsletter-subscribers',
    CAMPAIGNS: 'newsletter-campaigns'
  },
  ANALYTICS: {
    DASHBOARD: 'analytics',
    TRAFFIC: 'traffic-analytics'
  },
  SETTINGS: 'site-settings',
  BACKUP: 'backup-history',
  MONITORING: 'system-status'
};