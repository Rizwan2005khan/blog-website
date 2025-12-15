import Tag from '../models/Tag.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import slugify from 'slugify';
import { format } from 'date-fns';

// @desc    Get all tags
// @route   GET /api/tags
// @access  Public
export const getTags = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'active',
      search = '',
      sortBy = 'name',
      sortOrder = 'asc',
      includeStats = 'true',
      cloud = 'false',
      minPosts = 0
    } = req.query;

    // Build query
    let query = { status };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPosts > 0) {
      query['stats.totalPosts'] = { $gte: parseInt(minPosts) };
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const total = await Tag.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get tags
    let tags;
    
    if (cloud === 'true') {
      // Get tag cloud data (tags sized by post count)
      tags = await Tag.find(query)
        .select('name slug color stats.totalPosts')
        .sort({ 'stats.totalPosts': -1 })
        .limit(100)
        .lean();

      // Calculate font sizes for tag cloud
      const maxPosts = Math.max(...tags.map(tag => tag.stats.totalPosts));
      const minPosts = Math.min(...tags.map(tag => tag.stats.totalPosts));
      
      tags = tags.map(tag => ({
        ...tag,
        fontSize: calculateFontSize(tag.stats.totalPosts, minPosts, maxPosts),
        weight: calculateWeight(tag.stats.totalPosts, minPosts, maxPosts)
      }));
    } else {
      tags = await Tag.find(query)
        .populate('createdBy', 'firstName lastName username')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip(startIndex)
        .lean();
    }

    // Get popular tags
    const popularTags = await Tag.aggregate([
      { $match: { status: 'active' } },
      { $sort: { 'stats.totalPosts': -1 } },
      { $limit: 20 },
      {
        $project: {
          name: 1,
          slug: 1,
          color: 1,
          stats: 1
        }
      }
    ]);

    // Get trending tags (recent posts)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingTags = await Post.aggregate([
      { 
        $match: { 
          status: 'published',
          publishedDate: { $gte: sevenDaysAgo }
        }
      },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'tags',
          localField: '_id',
          foreignField: 'name',
          as: 'tag'
        }
      },
      { $unwind: '$tag' },
      {
        $project: {
          name: '$tag.name',
          slug: '$tag.slug',
          color: '$tag.color',
          recentCount: '$count',
          totalPosts: '$tag.stats.totalPosts'
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        tags,
        pagination: cloud === 'true' ? null : {
          currentPage: parseInt(page),
          totalPages,
          totalTags: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        popularTags,
        trendingTags
      }
    });

  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tags'
    });
  }
};

// @desc    Get single tag by slug
// @route   GET /api/tags/:slug
// @access  Public
export const getTagBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { includePosts = 'false', postLimit = 5 } = req.query;

    // Find tag
    const tag = await Tag.findOne({ slug })
      .populate('createdBy', 'firstName lastName username avatar');

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    // Check if tag is active
    if (tag.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    let posts = [];
    
    if (includePosts === 'true') {
      posts = await Post.find({
        tags: tag.name,
        status: 'published'
      })
        .populate('author', 'firstName lastName username avatar')
        .populate('category', 'name slug color')
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

    // Get related tags (tags that appear together in posts)
    const relatedTags = await Post.aggregate([
      { $match: { tags: tag.name, status: 'published' } },
      { $unwind: '$tags' },
      { $match: { tags: { $ne: tag.name } } },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'tags',
          localField: '_id',
          foreignField: 'name',
          as: 'tag'
        }
      },
      { $unwind: '$tag' },
      {
        $project: {
          name: '$tag.name',
          slug: '$tag.slug',
          color: '$tag.color',
          postsCount: '$tag.stats.totalPosts',
          relevance: '$count'
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        tag,
        posts,
        relatedTags
      }
    });

  } catch (error) {
    console.error('Get tag by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tag'
    });
  }
};

// @desc    Create new tag
// @route   POST /api/tags
// @access  Private/Admin
export const createTag = async (req, res) => {
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
      color = '#1976d2',
      icon = '',
      metaTitle = '',
      metaDescription = '',
      status = 'active'
    } = req.body;

    // Check if tag with same slug exists
    const existingTag = await Tag.findOne({ 
      slug: slug || slugify(name, { lower: true }) 
    });

    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: 'Tag with this slug already exists'
      });
    }

    // Create tag
    const tag = await Tag.create({
      name: name.toLowerCase().trim(),
      slug: slug || slugify(name, { lower: true }),
      description,
      color,
      icon,
      metaTitle: metaTitle || name,
      metaDescription,
      status,
      createdBy: req.user.id
    });

    // Populate for response
    await tag.populate('createdBy', 'firstName lastName username');

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: tag
    });

  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tag'
    });
  }
};

// @desc    Update tag
// @route   PUT /api/tags/:id
// @access  Private/Admin
export const updateTag = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const tag = await Tag.findById(req.params.id);
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    const {
      name,
      slug,
      description,
      color,
      icon,
      metaTitle,
      metaDescription,
      status
    } = req.body;

    // Check if new slug conflicts with existing tags
    if (slug && slug !== tag.slug) {
      const existingTag = await Tag.findOne({ slug });
      if (existingTag) {
        return res.status(400).json({
          success: false,
          message: 'Tag with this slug already exists'
        });
      }
    }

    // Update tag
    const updateData = {
      ...(name && { name: name.toLowerCase().trim() }),
      ...(slug && { slug }),
      ...(description !== undefined && { description }),
      ...(color && { color }),
      ...(icon !== undefined && { icon }),
      ...(metaTitle && { metaTitle }),
      ...(metaDescription !== undefined && { metaDescription }),
      ...(status && { status })
    };

    const updatedTag = await Tag.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName username');

    res.json({
      success: true,
      message: 'Tag updated successfully',
      data: updatedTag
    });

  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tag'
    });
  }
};

// @desc    Delete tag
// @route   DELETE /api/tags/:id
// @access  Private/Admin
export const deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    // Check if tag is used in posts
    const postCount = await Post.countDocuments({ tags: tag.name });
    if (postCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete tag that is used in ${postCount} posts. Please remove the tag from posts first.`
      });
    }

    await tag.deleteOne();

    res.json({
      success: true,
      message: 'Tag deleted successfully'
    });

  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tag'
    });
  }
};

// @desc    Get tag posts
// @route   GET /api/tags/:id/posts
// @access  Public
export const getTagPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'publishedDate',
      sortOrder = 'desc'
    } = req.query;

    // Find tag
    const tag = await Tag.findById(id);
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    const startIndex = (page - 1) * limit;

    // Build query
    const query = {
      tags: tag.name,
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
        tag: {
          id: tag._id,
          name: tag.name,
          slug: tag.slug,
          description: tag.description,
          color: tag.color,
          stats: tag.stats
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
    console.error('Get tag posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tag posts'
    });
  }
};

// @desc    Merge tags
// @route   POST /api/tags/merge
// @access  Private/Admin
export const mergeTags = async (req, res) => {
  try {
    const { sourceIds, targetId } = req.body;

    if (!Array.isArray(sourceIds) || sourceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Source tag IDs are required'
      });
    }

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: 'Target tag ID is required'
      });
    }

    // Find target tag
    const targetTag = await Tag.findById(targetId);
    if (!targetTag) {
      return res.status(404).json({
        success: false,
        message: 'Target tag not found'
      });
    }

    // Find source tags
    const sourceTags = await Tag.find({ _id: { $in: sourceIds } });
    if (sourceTags.length !== sourceIds.length) {
      return res.status(404).json({
        success: false,
        message: 'Some source tags not found'
      });
    }

    // Update posts to use target tag instead of source tags
    for (const sourceTag of sourceTags) {
      await Post.updateMany(
        { tags: sourceTag.name },
        { 
          $pull: { tags: sourceTag.name },
          $addToSet: { tags: targetTag.name }
        }
      );
    }

    // Delete source tags
    for (const sourceTag of sourceTags) {
      await sourceTag.deleteOne();
    }

    // Update target tag stats
    await targetTag.updateStats();

    res.json({
      success: true,
      message: `${sourceIds.length} tags merged into "${targetTag.name}" successfully`
    });

  } catch (error) {
    console.error('Merge tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to merge tags'
    });
  }
};

// @desc    Get tag suggestions
// @route   GET /api/tags/suggestions
// @access  Public
export const getTagSuggestions = async (req, res) => {
  try {
    const { query = '', limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query must be at least 2 characters'
      });
    }

    // Get tag suggestions based on query
    const suggestions = await Tag.find({
      status: 'active',
      name: { $regex: query, $options: 'i' }
    })
      .select('name slug color stats.totalPosts')
      .sort({ 'stats.totalPosts': -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Get tag suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tag suggestions'
    });
  }
};

// @desc    Get tag analytics
// @route   GET /api/tags/analytics
// @access  Private/Admin
export const getTagAnalytics = async (req, res) => {
  try {
    const { dateFrom = '', dateTo = '' } = req.query;

    // Build date filter
    let dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.createdAt.$lte = new Date(dateTo);
    }

    // Get overall tag stats
    const overallStats = await Tag.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalTags: { $sum: 1 },
          activeTags: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          inactiveTags: {
            $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
          },
          totalPosts: { $sum: '$stats.totalPosts' },
          totalViews: { $sum: '$stats.totalViews' }
        }
      }
    ]);

    // Get top tags by posts
    const topTags = await Tag.aggregate([
      { $match: { status: 'active' } },
      { $sort: { 'stats.totalPosts': -1 } },
      { $limit: 20 },
      {
        $project: {
          name: 1,
          slug: 1,
          color: 1,
          stats: 1
        }
      }
    ]);

    // Get tags with no posts
    const emptyTags = await Tag.find({
      'stats.totalPosts': 0,
      status: 'active'
    })
      .select('name slug description')
      .sort({ name: 1 });

    // Get tag creation trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tagTrends = await Tag.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          ...dateFilter
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: overallStats[0] || {
          totalTags: 0,
          activeTags: 0,
          inactiveTags: 0,
          totalPosts: 0,
          totalViews: 0
        },
        topTags,
        emptyTags,
        tagTrends
      }
    });

  } catch (error) {
    console.error('Get tag analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tag analytics'
    });
  }
};

// @desc    Auto-suggest tags for content
// @route   POST /api/tags/auto-suggest
// @access  Private/Admin
export const autoSuggestTags = async (req, res) => {
  try {
    const { content, title, existingTags = [], limit = 10 } = req.body;

    if (!content && !title) {
      return res.status(400).json({
        success: false,
        message: 'Content or title is required for tag suggestions'
      });
    }

    const combinedText = `${title || ''} ${content || ''}`.toLowerCase();

    // Get all active tags
    const allTags = await Tag.find({ status: 'active' })
      .select('name description stats.totalPosts')
      .lean();

    // Calculate relevance score for each tag
    const scoredTags = allTags.map(tag => {
      let score = 0;
      
      // Check if tag name appears in content
      const tagNameWords = tag.name.split(' ');
      tagNameWords.forEach(word => {
        if (combinedText.includes(word.toLowerCase())) {
          score += 2;
        }
      });

      // Check if tag description matches content
      if (tag.description && combinedText.includes(tag.description.toLowerCase())) {
        score += 1;
      }

      // Boost score based on popularity (posts count)
      score += Math.log(tag.stats.totalPosts + 1) * 0.5;

      // Penalize if already used
      if (existingTags.includes(tag.name)) {
        score = 0;
      }

      return {
        ...tag,
        relevanceScore: score
      };
    });

    // Sort by relevance and return top suggestions
    const suggestions = scoredTags
      .filter(tag => tag.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Auto-suggest tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-suggest tags'
    });
  }
};

// @desc    Export tags to CSV
// @route   GET /api/tags/export/csv
// @access  Private/Admin
export const exportTagsCSV = async (req, res) => {
  try {
    const { status = '', includeStats = 'true' } = req.query;

    // Build query
    let query = {};
    if (status) query.status = status;

    // Get tags with populated data
    const tags = await Tag.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ name: 1 })
      .lean();

    // Prepare CSV data
    const csvData = tags.map(tag => ({
      Name: tag.name,
      Slug: tag.slug,
      Description: tag.description,
      Posts: includeStats === 'true' ? tag.stats.totalPosts : 0,
      Views: includeStats === 'true' ? tag.stats.totalViews : 0,
      Status: tag.status,
      Color: tag.color,
      Icon: tag.icon,
      CreatedBy: tag.createdBy ? `${tag.createdBy.firstName} ${tag.createdBy.lastName}` : 'Unknown',
      Created: format(tag.createdAt, 'yyyy-MM-dd HH:mm:ss'),
      Modified: format(tag.updatedAt, 'yyyy-MM-dd HH:mm:ss')
    }));

    // Convert to CSV
    const { Parser } = await import('json2csv');
    const parser = new Parser();
    const csv = parser.parse(csvData);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="tags-export-${format(new Date(), 'yyyy-MM-dd')}.csv"`);

    res.send(csv);

  } catch (error) {
    console.error('Export tags CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export tags'
    });
  }
};

// @desc    Bulk update tag status
// @route   PUT /api/tags/bulk/status
// @access  Private/Admin
export const bulkUpdateStatus = async (req, res) => {
  try {
    const { tagIds, status } = req.body;

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tag IDs are required'
      });
    }

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const result = await Tag.updateMany(
      { _id: { $in: tagIds } },
      { status }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} tags updated successfully`
    });

  } catch (error) {
    console.error('Bulk update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update tags'
    });
  }
};

// @desc    Bulk delete tags
// @route   DELETE /api/tags/bulk
// @access  Private/Admin
export const bulkDeleteTags = async (req, res) => {
  try {
    const { tagIds } = req.body;

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tag IDs are required'
      });
    }

    // Check if tags are used in posts
    const tags = await Tag.find({ _id: { $in: tagIds } });
    let usedTagsCount = 0;

    for (const tag of tags) {
      const postCount = await Post.countDocuments({ tags: tag.name });
      if (postCount > 0) {
        usedTagsCount++;
      }
    }

    if (usedTagsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `${usedTagsCount} tags are currently used in posts and cannot be deleted`
      });
    }

    const result = await Tag.deleteMany({
      _id: { $in: tagIds }
    });

    res.json({
      success: true,
      message: `${result.deletedCount} tags deleted successfully`
    });

  } catch (error) {
    console.error('Bulk delete tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk delete tags'
    });
  }
};

// Helper functions

// Calculate font size for tag cloud
function calculateFontSize(count, minCount, maxCount) {
  const minSize = 12;
  const maxSize = 32;
  const normalizedCount = (count - minCount) / (maxCount - minCount || 1);
  return Math.round(minSize + (maxSize - minSize) * normalizedCount);
}

// Calculate weight for tag cloud
function calculateWeight(count, minCount, maxCount) {
  const normalizedCount = (count - minCount) / (maxCount - minCount || 1);
  return Math.round(normalizedCount * 100) / 100;
}

// Export additional functions for use in other controllers
export {
  calculateFontSize,
  calculateWeight
};