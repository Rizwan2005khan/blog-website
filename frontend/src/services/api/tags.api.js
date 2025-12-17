// src/services/api/tags.api.js
import API from './api.js';

export const tagsAPI = {
  // Get all tags
  getTags: async (params = {}) => {
    const response = await API.get('/tags', { params });
    return response.data;
  },

  // Get single tag
  getTag: async (id) => {
    const response = await API.get(`/tags/${id}`);
    return response.data;
  },

  // Get tag by slug
  getTagBySlug: async (slug) => {
    const response = await API.get(`/tags/slug/${slug}`);
    return response.data;
  },

  // Get popular tags
  getPopularTags: async (params = {}) => {
    const response = await API.get('/tags/popular', { params });
    return response.data;
  },

  // Admin endpoints
  createTag: async (tagData) => {
    const response = await API.post('/admin/tags', tagData);
    return response.data;
  },

  updateTag: async (id, tagData) => {
    const response = await API.put(`/admin/tags/${id}`, tagData);
    return response.data;
  },

  deleteTag: async (id) => {
    const response = await API.delete(`/admin/tags/${id}`);
    return response.data;
  }
};