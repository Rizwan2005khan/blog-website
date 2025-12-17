// src/services/api/posts.api.js
import API from './api.js';

export const postsAPI = {
  // Get all posts (public)
  getPosts: async (params = {}) => {
    const response = await API.get('/posts', { params });
    return response.data;
  },

  // Get single post (public)
  getPost: async (id) => {
    const response = await API.get(`/posts/${id}`);
    return response.data;
  },

  // Get post by slug (public)
  getPostBySlug: async (slug) => {
    const response = await API.get(`/posts/slug/${slug}`);
    return response.data;
  },

  // Create post (admin)
  createPost: async (postData) => {
    const response = await API.post('/posts', postData);
    return response.data;
  },

  // Update post (admin)
  updatePost: async (id, postData) => {
    const response = await API.put(`/posts/${id}`, postData);
    return response.data;
  },

  // Delete post (admin)
  deletePost: async (id) => {
    const response = await API.delete(`/posts/${id}`);
    return response.data;
  },

  // Get posts by category
  getPostsByCategory: async (categorySlug, params = {}) => {
    const response = await API.get(`/posts/category/${categorySlug}`, { params });
    return response.data;
  },

  // Get posts by tag
  getPostsByTag: async (tagSlug, params = {}) => {
    const response = await API.get(`/posts/tag/${tagSlug}`, { params });
    return response.data;
  },

  // Get posts by author
  getPostsByAuthor: async (authorId, params = {}) => {
    const response = await API.get(`/posts/author/${authorId}`, { params });
    return response.data;
  },

  // Search posts
  searchPosts: async (query, params = {}) => {
    const response = await API.get('/posts/search', { 
      params: { q: query, ...params } 
    });
    return response.data;
  },

  // Get related posts
  getRelatedPosts: async (postId, limit = 5) => {
    const response = await API.get(`/posts/${postId}/related`, { 
      params: { limit } 
    });
    return response.data;
  },

  // Get popular posts
  getPopularPosts: async (params = {}) => {
    const response = await API.get('/posts/popular', { params });
    return response.data;
  },

  // Get recent posts
  getRecentPosts: async (params = {}) => {
    const response = await API.get('/posts/recent', { params });
    return response.data;
  },

  // Increment post views
  incrementViews: async (postId) => {
    const response = await API.post(`/posts/${postId}/views`);
    return response.data;
  },

  // Admin endpoints
  getAdminPosts: async (params = {}) => {
    const response = await API.get('/admin/posts', { params });
    return response.data;
  },

  bulkActionPosts: async (action, postIds) => {
    const response = await API.post('/admin/posts/bulk-action', { action, postIds });
    return response.data;
  }
};