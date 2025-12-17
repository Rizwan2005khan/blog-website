// src/services/api/newsletter.api.js
import API from './api.js';

export const newsletterAPI = {
  // Subscribe to newsletter
  subscribe: async (email, name = '') => {
    const response = await API.post('/newsletter/subscribe', { email, name });
    return response.data;
  },

  // Unsubscribe from newsletter
  unsubscribe: async (email, token) => {
    const response = await API.post('/newsletter/unsubscribe', { email, token });
    return response.data;
  },

  // Verify subscription
  verifySubscription: async (token) => {
    const response = await API.get(`/newsletter/verify/${token}`);
    return response.data;
  },

  // Admin endpoints
  getSubscribers: async (params = {}) => {
    const response = await API.get('/admin/newsletter/subscribers', { params });
    return response.data;
  },

  createCampaign: async (campaignData) => {
    const response = await API.post('/admin/newsletter/campaigns', campaignData);
    return response.data;
  },

  getCampaigns: async (params = {}) => {
    const response = await API.get('/admin/newsletter/campaigns', { params });
    return response.data;
  },

  sendCampaign: async (campaignId) => {
    const response = await API.post(`/admin/newsletter/campaigns/${campaignId}/send`);
    return response.data;
  },

  getNewsletterStats: async () => {
    const response = await API.get('/admin/newsletter/stats');
    return response.data;
  },

  getPopularTags: async () => {
    const response = await API.get('/admin/newsletter/popular-tags');
    return response.data;
  }
};