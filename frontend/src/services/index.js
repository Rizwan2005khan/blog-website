// src/services/index.js
// Export all API services
export { authAPI } from './api/auth.api.js';
export { postsAPI } from './api/posts.api.js';
export { categoriesAPI } from './api/categories.api.js';
export { commentsAPI } from './api/comments.api.js';
export { usersAPI } from './api/users.api.js';
export { newsletterAPI } from './api/newsletter.api.js';
export { settingsAPI } from './api/settings.api.js';
export { tagsAPI } from './api/tags.api.js';
export { analyticsAPI } from './api/analytics.api.js';
export { dashboardAPI } from './api/dashboard.api.js';
export { backupAPI } from './api/backup.api.js';
export { monitoringAPI } from './api/monitoring.api.js';

// Export individual services that match your component imports
export { default as authService } from './auth.js';
export { default as postService } from './posts.js';
export { default as categoryService } from './categories.js';
export { default as commentService } from './comments.js';
export { default as userService } from './users.js';
export { default as newsletterService } from './newsletter.js';
export { default as settingsService } from './settings.js';
export { default as tagService } from './tags.js';
export { default as analyticsService } from './analytics.js';
export { default as dashboardService } from './dashboard.js';
export { default as backupService } from './backup.js';
export { default as monitoringService } from './monitoring.js';
export { default as apiService } from './api/api.js';