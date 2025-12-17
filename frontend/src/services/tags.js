// src/services/tags.js
import { tagsAPI } from './api/tags.api.js';

const tagService = {
  getTags: tagsAPI.getTags,
  getTag: tagsAPI.getTag,
  getTagBySlug: tagsAPI.getTagBySlug,
  getPopularTags: tagsAPI.getPopularTags,
  createTag: tagsAPI.createTag,
  updateTag: tagsAPI.updateTag,
  deleteTag: tagsAPI.deleteTag
};

export default tagService;