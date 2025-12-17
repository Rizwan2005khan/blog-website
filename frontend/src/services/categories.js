// src/services/categories.js
import { categoriesAPI } from './api/categories.api.js';

const categoryService = {
  getCategories: categoriesAPI.getCategories,
  getCategory: categoriesAPI.getCategory,
  getCategoryBySlug: categoriesAPI.getCategoryBySlug,
  getPopularCategories: categoriesAPI.getPopularCategories,
  createCategory: categoriesAPI.createCategory,
  updateCategory: categoriesAPI.updateCategory,
  deleteCategory: categoriesAPI.deleteCategory,
  getAdminCategories: categoriesAPI.getAdminCategories,
  getCategoriesWithCounts: categoriesAPI.getCategoriesWithCounts
};

export default categoryService;