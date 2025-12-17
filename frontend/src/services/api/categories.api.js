// src/services/api/categories.api.js
import API from './api.js';

export const categoriesAPI = {
  // Get all categories (public)
  getCategories: async (params = {}) => {
    const response = await API.get('/categories', { params });
    return response.data;
  },

  // Get single category (public)
  getCategory: async (id) => {
    const response = await API.get(`/categories/${id}`);
    return response.data;
  },

  // Get category by slug (public)
  getCategoryBySlug: async (slug) => {
    const response = await API.get(`/categories/slug/${slug}`);
    return response.data;
  },

  // Get popular categories
  getPopularCategories: async (params = {}) => {
    const response = await API.get('/categories/popular', { params });
    return response.data;
  },

  // Admin endpoints
  createCategory: async (categoryData) => {
    const response = await API.post('/admin/categories', categoryData);
    return response.data;
  },

  updateCategory: async (id, categoryData) => {
    const response = await API.put(`/admin/categories/${id}`, categoryData);
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await API.delete(`/admin/categories/${id}`);
    return response.data;
  },

  getAdminCategories: async (params = {}) => {
    const response = await API.get('/admin/categories', { params });
    return response.data;
  },

  // Get categories with post counts
  getCategoriesWithCounts: async () => {
    const response = await API.get('/categories/with-counts');
    return response.data;
  }
};