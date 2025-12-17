// src/services/posts.js
import { postsAPI } from './api/posts.api.js';

const postService = {
  getPosts: postsAPI.getPosts,
  getPost: postsAPI.getPost,
  getPostBySlug: postsAPI.getPostBySlug,
  createPost: postsAPI.createPost,
  updatePost: postsAPI.updatePost,
  deletePost: postsAPI.deletePost,
  getPostsByCategory: postsAPI.getPostsByCategory,
  getPostsByTag: postsAPI.getPostsByTag,
  getPostsByAuthor: postsAPI.getPostsByAuthor,
  searchPosts: postsAPI.searchPosts,
  getRelatedPosts: postsAPI.getRelatedPosts,
  getPopularPosts: postsAPI.getPopularPosts,
  getRecentPosts: postsAPI.getRecentPosts,
  incrementViews: postsAPI.incrementViews,
  getAdminPosts: postsAPI.getAdminPosts,
  bulkActionPosts: postsAPI.bulkActionPosts
};

export default postService;