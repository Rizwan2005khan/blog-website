// src/services/api.js
import API from './api/api.js';

const apiService = {
  getDocumentation: async () => {
    const response = await API.get('/api/docs');
    return response.data;
  },
  
  // Add other API-related methods here
};

export default apiService;