// src/services/api/comments.api.js
import API from './api.js';

export const commentsAPI = {
  // Get comments for a post (public)
  getPostComments: async (postId, params = {}) => {
    const response = await API.get(`/posts/${postId}/comments`, { params });
    return response.data;
  },

  // Create comment
  createComment: async (commentData) => {
    const response = await API.post('/comments', commentData);
    return response.data;
  },

  // Update comment
  updateComment: async (id, commentData) => {
    const response = await API.put(`/comments/${id}`, commentData);
    return response.data;
  },

  // Delete comment
  deleteComment: async (id) => {
    const response = await API.delete(`/comments/${id}`);
    return response.data;
  },

  // Reply to comment
  replyToComment: async (parentId, replyData) => {
    const response = await API.post(`/comments/${parentId}/reply`, replyData);
    return response.data;
  },

  // Like/unlike comment
  toggleCommentLike: async (commentId) => {
    const response = await API.post(`/comments/${commentId}/like`);
    return response.data;
  },

  // Admin endpoints
  getCommentsForModeration: async (params = {}) => {
    const response = await API.get('/admin/comments', { params });
    return response.data;
  },

  approveComment: async (commentId) => {
    const response = await API.post(`/admin/comments/${commentId}/approve`);
    return response.data;
  },

  rejectComment: async (commentId) => {
    const response = await API.post(`/admin/comments/${commentId}/reject`);
    return response.data;
  },

  getCommentStats: async () => {
    const response = await API.get('/admin/comments/stats');
    return response.data;
  }
};