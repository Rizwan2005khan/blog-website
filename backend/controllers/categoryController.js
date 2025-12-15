import Category from '../models/Category.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import slugify from 'slugify';
import { format } from 'date-fns';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      parent = '',
      status = 'active',
      search = '',
      sortBy = 'sortOrder',
      sortOrder = 'asc',
      includeStats = 'true',
      hierarchical = 'false'
    } = req.query;

    // Build query
    let query = { status };
    
    if (parent === 'null') {
      query.parent = null;
    } else if (parent) {
      query.parent = parent;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const total = await Category.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get categories
    let categories;
    
    if (hierarchical === 'true') {
      // Get hierarchical structure
      categories = await Category.find(query)
        .populate({
          path: 'subcategories',
          match: { status },
          populate: {
            path: 'subcategories',
            match: { status }
          }
        })
        .sort(sortOptions)
        .lean();
    } else {
      // Get flat list
      categories = await Category.find(query)
        .populate('parent', 'name slug')
        .populate('createdBy', 'firstName lastName username')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip(startIndex)
        .lean();
    }

    // Add stats if requested
    if (includeStats === 'true') {
      for (const category of categories) {
        await Category.populate(category, {
          path: 'stats',
          transform: (doc) => doc ? doc.toObject() : { totalPosts: 0, totalViews: 0 }
        });
      }
    }

    // Get additional data
    const popularCategories = await Category.aggregate([
      { $match: { status: 'active' } },
      { $sort: { 'stats.totalPosts': -1 } },
      { $limit: 10 },
      {
        $project: {
          name: 1,
          slug: 1,
          color: 1,
          icon: 1,
          stats: 1
        }
      }
    ]);

    const categoryTree = await buildCategoryTree(status);

    res.json({
      success: true,
      data: {
        categories,
        pagination: hierarchical === 'true' ? null : {
          currentPage: parseInt(page),
          totalPages,
          totalCategories: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        popularCategories,
        categoryTree: hierarchical === 'true' ? categoryTree : null
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories'
    });
  }
};

// @desc    Get single category by slug
// @route   GET /api/categories/:slug
// @access  Public
export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { includePosts = 'false', postLimit = 5 } = req.query;

    // Find category
    const category = await Category.findOne({ slug })
      .populate('parent', 'name slug description')
      .populate('createdBy', 'firstName lastName username avatar')
      .populate({
        path: 'subcategories',
        match: { status: 'active' },
        select: 'name slug description color icon stats',
        options: { sort: { sortOrder: 1 } }
      });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category is active
    if (category.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    let posts = [];
    
    if (includePosts === 'true') {
      posts = await Post.find({
        category: category._id,
        status: 'published'
      })
        .populate('author', 'firstName lastName username avatar')
        .sort({ publishedDate: -1 })
        .limit(parseInt(postLimit))
        .lean();

      // Add engagement data
      posts = posts.map(post => ({
        ...post,
        engagement: {
          ...post.engagement,
          likesCount: post.engagement.likes.length,
          bookmarksCount: post.engagement.bookmarks.length
        }
      }));
    }

    // Get breadcrumb
    const breadcrumb = await getCategoryBreadcrumb(category);

    // Get sibling categories
    const siblings = await Category.find({
      parent: category.parent,
      _id: { $ne: category._id },
      status: 'active'
    })
      .select('name slug color icon')
      .sort({ sortOrder: 1 });

    res.json({
      success: true,
      data: {
        category: {
          ...category.toObject(),
          breadcrumb,
          siblings
        },
        posts
      }
    });

  } catch (error) {
    console.error('Get category by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category'
    });
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      name,
      slug,
      description = '',
      parent = null,
      image = {},
      color = '#1976d2',
      icon = '',
      metaTitle = '',
      metaDescription = '',
      sortOrder = 0,
      status = 'active'
    } = req.body;

    // Check if category with same slug exists
    const existingCategory = await Category.findOne({ 
      slug: slug || slugify(name, { lower: true }) 
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this slug already exists'
      });
    }

    // Validate parent category
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }
      
      // Prevent circular reference
      if (parentCategory.parent && parentCategory.parent.toString() === parent) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create circular category hierarchy'
        });
      }
    }

    // Create category
    const category = await Category.create({
      name,
      slug: slug || slugify(name, { lower: true }),
      description,
      parent,
      image,
      color,
      icon,
      metaTitle: metaTitle || name,
      metaDescription,
      sortOrder,
      status,
      createdBy: req.user.id
    });

    // Populate for response
    await category.populate('parent', 'name slug');
    await category.populate('createdBy', 'firstName lastName username');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category'
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const {
      name,
      slug,
      description,
      parent,
      image,
      color,
      icon,
      metaTitle,
      metaDescription,
      sortOrder,
      status
    } = req.body;

    // Check if new slug conflicts with existing categories
    if (slug && slug !== category.slug) {
      const existingCategory = await Category.findOne({ slug });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this slug already exists'
        });
      }
    }

    // Validate parent category (prevent circular reference)
    if (parent && parent !== category.parent?.toString()) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }
      
      // Prevent setting self as parent
      if (parent === category._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent'
        });
      }
      
      // Check for circular reference in hierarchy
      const hasCircularReference = await checkCircularReference(category._id, parent);
      if (hasCircularReference) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create circular category hierarchy'
        });
      }
    }

    // Update category
    const updateData = {
      ...(name && { name }),
      ...(slug && { slug }),
      ...(description !== undefined && { description }),
      ...(parent !== undefined && { parent }),
      ...(image && { image }),
      ...(color && { color }),
      ...(icon !== undefined && { icon }),
      ...(metaTitle && { metaTitle }),
      ...(metaDescription !== undefined && { metaDescription }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(status && { status })
    };

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('parent', 'name slug')
      .populate('createdBy', 'firstName lastName username');

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has posts
    const postCount = await Post.countDocuments({ category: category._id });
    if (postCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${postCount} posts. Please reassign or delete posts first.`
      });
    }

    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({ parent: category._id });
    if (subcategoryCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${subcategoryCount} subcategories. Please reassign subcategories first.`
      });
    }

    // Delete category image from cloudinary
    if (category.image.publicId) {
      // await cloudinary.uploader.destroy(category.image.publicId);
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
};

// @desc    Get category tree (hierarchical structure)
// @route   GET /api/categories/tree
// @access  Public
export const getCategoryTree = async (req, res) => {
  try {
    const { status = 'active', includeEmpty = 'true' } = req.query;

    const tree = await buildCategoryTree(status, includeEmpty === 'true');

    res.json({
      success: true,
      data: tree
    });

  } catch (error) {
    console.error('Get category tree error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category tree'
    });
  }
};

// @desc    Get category posts
// @route   GET /api/categories/:id/posts
// @access  Public
export const getCategoryPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'publishedDate',
      sortOrder = 'desc',
      includeSubcategories = 'true'
    } = req.query;

    // Find category
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Build category IDs array (include subcategories if requested)
    let categoryIds = [category._id];
    
    if (includeSubcategories === 'true') {
      const subcategoryIds = await getAllSubcategoryIds(category._id);
      categoryIds = [...categoryIds, ...subcategoryIds];
    }

    const startIndex = (page - 1) * limit;

    // Build query
    const query = {
      category: { $in: categoryIds },
      status: 'published'
    };

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get posts
    const posts = await Post.find(query)
      .populate('author', 'firstName lastName username avatar')
      .populate('category', 'name slug color')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip(startIndex)
      .lean();

    const total = await Post.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Add engagement data
    const postsWithEngagement = posts.map(post => ({
      ...post,
      engagement: {
        ...post.engagement,
        likesCount: post.engagement.likes.length,
        bookmarksCount: post.engagement.bookmarks.length
      }
    }));

    res.json({
      success: true,
      data: {
        category: {
          id: category._id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
          color: category.color,
          stats: category.stats
        },
        posts: postsWithEngagement,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPosts: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get category posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category posts'
    });
  }
};

// @desc    Reorder categories
// @route   PUT /api/categories/reorder
// @access  Private/Admin
export const reorderCategories = async (req, res) => {
  try {
    const { categories } = req.body; // Array of { id, sortOrder }

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Categories array is required'
      });
    }

    // Update sort orders
    const updatePromises = categories.map(cat => 
      Category.findByIdAndUpdate(
        cat.id,
        { sortOrder: cat.sortOrder },
        { new: true }
      )
    );

    const updatedCategories = await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Categories reordered successfully',
      data: updatedCategories
    });

  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder categories'
    });
  }
};

// @desc    Merge categories
// @route   POST /api/categories/merge
// @access  Private/Admin
export const mergeCategories = async (req, res) => {
  try {
    const { sourceIds, targetId } = req.body;

    if (!Array.isArray(sourceIds) || sourceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Source category IDs are required'
      });
    }

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: 'Target category ID is required'
      });
    }

    // Find target category
    const targetCategory = await Category.findById(targetId);
    if (!targetCategory) {
      return res.status(404).json({
        success: false,
        message: 'Target category not found'
      });
    }

    // Find source categories
    const sourceCategories = await Category.find({ _id: { $in: sourceIds } });
    if (sourceCategories.length !== sourceIds.length) {
      return res.status(404).json({
        success: false,
        message: 'Some source categories not found'
      });
    }

    // Move posts from source to target
    await Post.updateMany(
      { category: { $in: sourceIds } },
      { category: targetId }
    );

    // Move subcategories from source to target
    await Category.updateMany(
      { parent: { $in: sourceIds } },
      { parent: targetId }
    );

    // Delete source categories
    for (const sourceCategory of sourceCategories) {
      // Delete images from cloudinary
      if (sourceCategory.image.publicId) {
        // await cloudinary.uploader.destroy(sourceCategory.image.publicId);
      }
      await sourceCategory.deleteOne();
    }

    // Update target category stats
    await targetCategory.updateStats();

    res.json({
      success: true,
      message: `${sourceIds.length} categories merged into "${targetCategory.name}" successfully`
    });

  } catch (error) {
    console.error('Merge categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to merge categories'
    });
  }
};

// @desc    Get category analytics
// @route   GET /api/categories/analytics
// @access  Private/Admin
export const getCategoryAnalytics = async (req, res) => {
  try {
    // Get overall category stats
    const overallStats = await Category.aggregate([
      { $group: {
        _id: null,
        totalCategories: { $sum: 1 },
        activeCategories: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        inactiveCategories: {
          $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
        },
        totalPosts: { $sum: '$stats.totalPosts' },
        totalViews: { $sum: '$stats.totalViews' }
      }}
    ]);

    // Get top categories by posts
    const topCategories = await Category.aggregate([
      { $match: { status: 'active' } },
      { $sort: { 'stats.totalPosts': -1 } },
      { $limit: 10 },
      {
        $project: {
          name: 1,
          slug: 1,
          color: 1,
          stats: 1
        }
      }
    ]);

    // Get categories with no posts
    const emptyCategories = await Category.find({
      'stats.totalPosts': 0,
      status: 'active'
    })
      .select('name slug description')
      .sort({ name: 1 });

    // Get parent-child relationships
    const parentCategories = await Category.find({ parent: null, status: 'active' })
      .select('name slug stats')
      .sort({ name: 1 });

    const childCategories = await Category.find({ 
      parent: { $ne: null }, 
      status: 'active' 
    })
      .populate('parent', 'name slug')
      .select('name slug parent stats')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: {
        overview: overallStats[0] || {
          totalCategories: 0,
          activeCategories: 0,
          inactiveCategories: 0,
          totalPosts: 0,
          totalViews: 0
        },
        topCategories,
        emptyCategories,
        parentCategories,
        childCategories: childCategories.length
      }
    });

  } catch (error) {
    console.error('Get category analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category analytics'
    });
  }
};

// @desc    Export categories to CSV
// @route   GET /api/categories/export/csv
// @access  Private/Admin
export const exportCategoriesCSV = async (req, res) => {
  try {
    const { status = '', includeStats = 'true' } = req.query;

    // Build query
    let query = {};
    if (status) query.status = status;

    // Get categories with populated data
    const categories = await Category.find(query)
      .populate('parent', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ name: 1 })
      .lean();

    // Prepare CSV data
    const csvData = categories.map(category => ({
      Name: category.name,
      Slug: category.slug,
      Description: category.description,
      Parent: category.parent ? category.parent.name : 'None',
      Posts: includeStats === 'true' ? category.stats.totalPosts : 0,
      Views: includeStats === 'true' ? category.stats.totalViews : 0,
      Status: category.status,
      Color: category.color,
      Icon: category.icon,
      SortOrder: category.sortOrder,
      CreatedBy: category.createdBy ? `${category.createdBy.firstName} ${category.createdBy.lastName}` : 'Unknown',
      Created: format(category.createdAt, 'yyyy-MM-dd HH:mm:ss'),
      Modified: format(category.updatedAt, 'yyyy-MM-dd HH:mm:ss')
    }));

    // Convert to CSV (you'll need to install json2csv)
    const { Parser } = await import('json2csv');
    const parser = new Parser();
    const csv = parser.parse(csvData);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="categories-export-${format(new Date(), 'yyyy-MM-dd')}.csv"`);

    res.send(csv);

  } catch (error) {
    console.error('Export categories CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export categories'
    });
  }
};

// Helper functions

// Build hierarchical category tree
async function buildCategoryTree(status = 'active', includeEmpty = true) {
  const categories = await Category.find({ status })
    .populate({
      path: 'subcategories',
      match: { status },
      populate: {
        path: 'subcategories',
        match: { status }
      }
    })
    .sort({ sortOrder: 1, name: 1 });

  // Filter out empty categories if requested
  if (!includeEmpty) {
    return categories.filter(cat => cat.stats.totalPosts > 0);
  }

  return categories;
}

// Get category breadcrumb
async function getCategoryBreadcrumb(category) {
  const breadcrumb = [];
  let currentCategory = category;

  while (currentCategory && currentCategory.parent) {
    const parent = await Category.findById(currentCategory.parent)
      .select('name slug parent');
    
    if (parent) {
      breadcrumb.unshift({
        id: parent._id,
        name: parent.name,
        slug: parent.slug
      });
      currentCategory = parent;
    } else {
      break;
    }
  }

  return breadcrumb;
}

// Get all subcategory IDs recursively
async function getAllSubcategoryIds(categoryId) {
  const subcategories = await Category.find({ parent: categoryId })
    .select('_id');
  
  let allIds = subcategories.map(cat => cat._id);
  
  for (const subcategory of subcategories) {
    const childIds = await getAllSubcategoryIds(subcategory._id);
    allIds = [...allIds, ...childIds];
  }
  
  return allIds;
}

// Check for circular reference in category hierarchy
async function checkCircularReference(categoryId, newParentId) {
  let currentParentId = newParentId;
  
  while (currentParentId) {
    if (currentParentId.toString() === categoryId.toString()) {
      return true; // Circular reference found
    }
    
    const parent = await Category.findById(currentParentId).select('parent');
    if (!parent) break;
    
    currentParentId = parent.parent;
  }
  
  return false;
}

// Get category stats for a specific time period
async function getCategoryStats(categoryId, startDate, endDate) {
  const stats = await Post.aggregate([
    {
      $match: {
        category: categoryId,
        status: 'published',
        publishedDate: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalPosts: { $sum: 1 },
        totalViews: { $sum: '$engagement.views' },
        totalLikes: { $sum: { $size: '$engagement.likes' } },
        totalComments: { $sum: '$comments.total' },
        avgReadingTime: { $avg: '$readingTime' }
      }
    }
  ]);

  return stats[0] || {
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    avgReadingTime: 0
  };
}

// Auto-categorize posts based on content (AI-powered feature placeholder)
export const autoCategorizePosts = async (req, res) => {
  try {
    const { postIds } = req.body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Post IDs are required'
      });
    }

    const posts = await Post.find({ _id: { $in: postIds } });
    const results = [];

    // This is a placeholder for AI categorization
    // In a real implementation, you'd use NLP/ML to analyze post content
    for (const post of posts) {
      // Simple keyword-based categorization (example)
      const content = post.title + ' ' + post.content;
      const keywords = {
        technology: ['tech', 'software', 'programming', 'coding', 'ai', 'machine learning'],
        business: ['business', 'startup', 'entrepreneur', 'marketing', 'finance'],
        lifestyle: ['lifestyle', 'health', 'fitness', 'travel', 'food'],
        education: ['education', 'learning', 'study', 'tutorial', 'guide']
      };

      let bestCategory = null;
      let maxScore = 0;

      for (const [categoryName, categoryKeywords] of Object.entries(keywords)) {
        const score = categoryKeywords.reduce((acc, keyword) => {
          const matches = (content.match(new RegExp(keyword, 'gi')) || []).length;
          return acc + matches;
        }, 0);

        if (score > maxScore) {
          maxScore = score;
          const category = await Category.findOne({ 
            name: { $regex: categoryName, $options: 'i' } 
          });
          if (category) bestCategory = category._id;
        }
      }

      if (bestCategory && bestCategory !== post.category) {
        post.category = bestCategory;
        await post.save();
        
        results.push({
          postId: post._id,
          postTitle: post.title,
          newCategory: bestCategory,
          confidence: maxScore
        });
      }
    }

    res.json({
      success: true,
      message: `${results.length} posts auto-categorized successfully`,
      data: results
    });

  } catch (error) {
    console.error('Auto-categorize posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-categorize posts'
    });
  }
};