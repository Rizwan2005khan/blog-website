// src/services/newsletter.js
import { newsletterAPI } from './api/newsletter.api.js';

const newsletterService = {
  subscribe: newsletterAPI.subscribe,
  unsubscribe: newsletterAPI.unsubscribe,
  verifySubscription: newsletterAPI.verifySubscription,
  getSubscribers: newsletterAPI.getSubscribers,
  createCampaign: newsletterAPI.createCampaign,
  getCampaigns: newsletterAPI.getCampaigns,
  sendCampaign: newsletterAPI.sendCampaign,
  getNewsletterStats: newsletterAPI.getNewsletterStats,
  getPopularTags: newsletterAPI.getPopularTags
};

export default newsletterService;