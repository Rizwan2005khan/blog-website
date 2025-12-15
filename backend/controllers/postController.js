import Post from '../models/Post.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import Tag from '../models/Tag.js';
import { validationResult } from 'express-validator';
import slugify from 'slugify';
import readingTime from 'reading-time';
import { Parser } from 'json2csv';
import { format, parseISO } from 'date-fns';

// @desc    Get all published posts (public)
// @route   GET /api/posts
// @access  Public
export const getPublishedPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category = '',
      tag = '',
      author = '',
      search = '',
      sortBy = 'publishedDate',
      sortOrder = 'desc',
      dateFrom = '',
      dateTo = '',
      status = 'published'
    } = req.query;

    // Build query
    let query = { status };

    // Category filter
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    // Author filter
    if (author) {
      const authorDoc = await User.findOne({ username: author });
      if (authorDoc) {
        query.author = authorDoc._id;
      }
    }

    // Tag filter
    if (tag) {
      query.tags = { $in: [tag] };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.publishedDate = {};
      if (dateFrom) {
        query.publishedDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.publishedDate.$lte = new Date(dateTo);
      }
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const total = await Post.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get posts
    const posts = await Post.find(query)
      .populate('author', 'firstName lastName username avatar bio')
      .populate('category', 'name slug color')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip(startIndex)
      .lean();

    // Get related data
    const popularTags = await Post.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    const popularCategories = await Post.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { name: '$category.name', slug: '$category.slug', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

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
        posts: postsWithEngagement,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPosts: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit: parseInt(limit)
        },
        filters: {
          popularTags: popularTags.map(tag => ({ name: tag._id, count: tag.count })),
          popularCategories
        }
      }
    });

  } catch (error) {
    console.error('Get published posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get posts'
    });
  }
};

// @desc    Get single post by slug
// @route   GET /api/posts/:slug
// @access  Public
export const getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { password } = req.query;

    // Find post
    const post = await Post.findOne({ slug })
      .populate('author', 'firstName lastName username avatar bio socialLinks')
      .populate('category', 'name slug color description')
      .populate('relatedPosts', 'title slug featuredImage publishedDate readingTime');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check post status and visibility
    if (post.status === 'draft') {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.status === 'scheduled' && post.publishedDate > new Date()) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check password protection
    if (post.visibility === 'password') {
      if (!password || password !== post.password) {
        return res.status(403).json({
          success: false,
          message: 'Password required to access this post'
        });
      }
    }

    // Increment view count
    post.engagement.views += 1;
    await post.save();

    // Check if current user has liked/bookmarked
    let userLiked = false;
    let userBookmarked = false;
    
    if (req.user) {
      userLiked = post.engagement.likes.includes(req.user.id);
      userBookmarked = post.engagement.bookmarks.includes(req.user.id);
    }

    // Get related posts
    const relatedPosts = await post.getRelatedPosts(3);

    // Get comments
    const Comment = mongoose.model('Comment');
    const comments = await Comment.getCommentTree(post._id);

    // Prepare response
    const postResponse = {
      ...post.toObject(),
      engagement: {
        ...post.engagement.toObject(),
        likesCount: post.engagement.likes.length,
        bookmarksCount: post.engagement.bookmarks.length,
        userLiked,
        userBookmarked
      },
      relatedPosts,
      comments
    };

    res.json({
      success: true,
      data: postResponse
    });

  } catch (error) {
    console.error('Get post by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get post'
    });
  }
};

// @desc    Create new post
// @route   POST /api/posts
// @access  Private/Author
export const createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      title,
      slug,
      content,
      excerpt,
      category,
      tags = [],
      status = 'draft',
      scheduledDate,
      featuredImage,
      metaTitle,
      metaDescription,
      metaKeywords = [],
      socialSharing = {},
      visibility = 'public',
      password = '',
      allowIndexing = true,
      canonicalUrl = '',
      customCss = '',
      customJs = '',
      relatedPosts = [],
      series = {}
    } = req.body;

    // Check if slug already exists
    const existingPost = await Post.findOne({ slug: slug || slugify(title, { lower: true }) });
    if (existingPost) {
      return res.status(400).json({
        success: false,
        message: 'A post with this slug already exists'
      });
    }

    // Verify category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Handle scheduling
    let publishDate = null;
    if (status === 'published') {
      publishDate = new Date();
    } else if (status === 'scheduled' && scheduledDate) {
      publishDate = new Date(scheduledDate);
      if (publishDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled date must be in the future'
        });
      }
    }

    // Process tags
    const processedTags = tags.map(tag => 
      typeof tag === 'string' ? tag.toLowerCase().trim() : tag
    );

    // Create post
    const post = await Post.create({
      title,
      slug: slug || slugify(title, { lower: true }),
      content,
      excerpt: excerpt || generateExcerpt(content),
      author: req.user.id,
      category,
      tags: processedTags,
      status,
      scheduledDate: publishDate,
      publishedDate: publishDate,
      featuredImage,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || generateExcerpt(content, 160),
      metaKeywords,
      socialSharing: {
        facebook: socialSharing.facebook !== undefined ? socialSharing.facebook : true,
        twitter: socialSharing.twitter !== undefined ? socialSharing.twitter : true,
        linkedin: socialSharing.linkedin !== undefined ? socialSharing.linkedin : true,
        whatsapp: socialSharing.whatsapp !== undefined ? socialSharing.whatsapp : true,
        telegram: socialSharing.telegram !== undefined ? socialSharing.telegram : true,
        reddit: socialSharing.reddit !== undefined ? socialSharing.reddit : true
      },
      visibility,
      password: visibility === 'password' ? password : '',
      allowIndexing,
      canonicalUrl,
      customCss,
      customJs,
      relatedPosts,
      series
    });

    // Update category stats
    await categoryDoc.updateStats();

    // Update tag stats
    for (const tagName of processedTags) {
      let tag = await Tag.findOne({ name: tagName });
      if (!tag) {
        tag = await Tag.create({
          name: tagName,
          slug: slugify(tagName, { lower: true }),
          createdBy: req.user.id
        });
      }
      await tag.updateStats();
    }

    // Populate for response
    await post.populate('author', 'firstName lastName username avatar');
    await post.populate('category', 'name slug color');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post'
    });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private/Author
export const updatePost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check authorization
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    const {
      title,
      slug,
      content,
      excerpt,
      category,
      tags,
      status,
      scheduledDate,
      featuredImage,
      metaTitle,
      metaDescription,
      metaKeywords,
      socialSharing,
      visibility,
      password,
      allowIndexing,
      canonicalUrl,
      customCss,
      customJs,
      relatedPosts,
      series
    } = req.body;

    // Check if new slug conflicts with existing posts
    if (slug && slug !== post.slug) {
      const existingPost = await Post.findOne({ slug });
      if (existingPost) {
        return res.status(400).json({
          success: false,
          message: 'A post with this slug already exists'
        });
      }
    }

    // Handle category change
    let oldCategoryId = null;
    if (category && category !== post.category.toString()) {
      oldCategoryId = post.category;
      const newCategory = await Category.findById(category);
      if (!newCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    // Handle status changes
    let publishDate = post.publishedDate;
    if (status && status !== post.status) {
      if (status === 'published' && post.status !== 'published') {
        publishDate = new Date();
      } else if (status === 'scheduled' && scheduledDate) {
        publishDate = new Date(scheduledDate);
        if (publishDate <= new Date()) {
          return res.status(400).json({
            success: false,
            message: 'Scheduled date must be in the future'
          });
        }
      }
    }

    // Update post
    const updateData = {
      ...(title && { title }),
      ...(slug && { slug }),
      ...(content && { content }),
      ...(excerpt !== undefined && { excerpt }),
      ...(category && { category }),
      ...(tags && { tags: tags.map(tag => typeof tag === 'string' ? tag.toLowerCase().trim() : tag) }),
      ...(status && { status }),
      ...(scheduledDate && { scheduledDate: new Date(scheduledDate) }),
      ...(publishDate && { publishedDate: publishDate }),
      ...(featuredImage && { featuredImage }),
      ...(metaTitle && { metaTitle }),
      ...(metaDescription && { metaDescription }),
      ...(metaKeywords && { metaKeywords }),
      ...(socialSharing && { socialSharing: { ...post.socialSharing, ...socialSharing } }),
      ...(visibility && { visibility }),
      ...(password && { password: visibility === 'password' ? password : '' }),
      ...(allowIndexing !== undefined && { allowIndexing }),
      ...(canonicalUrl && { canonicalUrl }),
      ...(customCss && { customCss }),
      ...(customJs && { customJs }),
      ...(relatedPosts && { relatedPosts }),
      ...(series && { series })
    };

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('author', 'firstName lastName username avatar')
      .populate('category', 'name slug color');

    // Update old and new category stats if category changed
    if (oldCategoryId) {
      const oldCategory = await Category.findById(oldCategoryId);
      if (oldCategory) {
        await oldCategory.updateStats();
      }
    }

    if (category && category !== post.category.toString()) {
      const newCategory = await Category.findById(category);
      if (newCategory) {
        await newCategory.updateStats();
      }
    }

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: updatedPost
    });

  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post'
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private/Author
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check authorization
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    const categoryId = post.category;

    // Delete featured image from cloudinary
    if (post.featuredImage.publicId) {
      // await cloudinary.uploader.destroy(post.featuredImage.publicId);
    }

    await post.deleteOne();

    // Update category stats
    const category = await Category.findById(categoryId);
    if (category) {
      await category.updateStats();
    }

    // Update tag stats
    for (const tagName of post.tags) {
      const tag = await Tag.findOne({ name: tagName });
      if (tag) {
        await tag.updateStats();
      }
    }

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post'
    });
  }
};

// @desc    Get posts for admin dashboard
// @route   GET /api/posts/admin
// @access  Private/Admin
export const getAdminPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = '',
      author = '',
      category = '',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (author) {
      query.author = author;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const total = await Post.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

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

    // Get additional stats
    const stats = await Post.aggregate([
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);

    const statusCounts = {};
    stats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPosts: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit: parseInt(limit)
        },
        statusCounts
      }
    });

  } catch (error) {
    console.error('Get admin posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin posts'
    });
  }
};

// @desc    Toggle post like
// @route   POST /api/posts/:id/like
// @access  Private
export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if post is published
    if (post.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot like unpublished post'
      });
    }

    const userId = req.user.id;
    const likeIndex = post.engagement.likes.indexOf(userId);
    let liked = false;

    if (likeIndex === -1) {
      post.engagement.likes.push(userId);
      liked = true;
    } else {
      post.engagement.likes.splice(likeIndex, 1);
    }

    await post.save();

    res.json({
      success: true,
      message: liked ? 'Post liked' : 'Post unliked',
      data: {
        liked,
        likesCount: post.engagement.likes.length
      }
    });

  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like'
    });
  }
};

// @desc    Toggle post bookmark
// @route   POST /api/posts/:id/bookmark
// @access  Private
export const toggleBookmark = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if post is published
    if (post.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot bookmark unpublished post'
      });
    }

    const userId = req.user.id;
    const bookmarkIndex = post.engagement.bookmarks.indexOf(userId);
    let bookmarked = false;

    if (bookmarkIndex === -1) {
      post.engagement.bookmarks.push(userId);
      bookmarked = true;
    } else {
      post.engagement.bookmarks.splice(bookmarkIndex, 1);
    }

    await post.save();

    res.json({
      success: true,
      message: bookmarked ? 'Post bookmarked' : 'Post unbookmarked',
      data: {
        bookmarked,
        bookmarksCount: post.engagement.bookmarks.length
      }
    });

  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle bookmark'
    });
  }
};

// @desc    Get user's bookmarked posts
// @route   GET /api/posts/bookmarks
// @access  Private
export const getBookmarkedPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10
    } = req.query;

    const startIndex = (page - 1) * limit;

    // Get bookmarked posts
    const posts = await Post.find({
      'engagement.bookmarks': req.user.id,
      status: 'published'
    })
      .populate('author', 'firstName lastName username avatar')
      .populate('category', 'name slug color')
      .sort({ publishedDate: -1 })
      .limit(limit * 1)
      .skip(startIndex);

    const total = await Post.countDocuments({
      'engagement.bookmarks': req.user.id,
      status: 'published'
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        posts,
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
    console.error('Get bookmarked posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookmarked posts'
    });
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:id/comments
// @access  Public/Private (depending on settings)
export const addComment = async (req, res) => {
  try {
    const { content, parent } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if comments are enabled
    if (!post.comments.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Comments are disabled for this post'
      });
    }

    // Check if post is published
    if (post.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot comment on unpublished post'
      });
    }

    let authorData = {};

    if (req.user) {
      // Authenticated user
      const user = await User.findById(req.user.id);
      authorData = {
        name: user.fullName,
        email: user.email,
        website: user.socialLinks?.website || ''
      };
    } else {
      // Anonymous user
      const { name, email, website } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Name and email are required for anonymous comments'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

      authorData = { name, email, website: website || '' };
    }

    // Add IP address and user agent for moderation
    authorData.ipAddress = req.ip;
    authorData.userAgent = req.get('User-Agent');

    // Create comment
    const comment = await post.addComment({
      author: authorData,
      content,
      parent: parent || null
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
};

// @desc    Get post comments
// @route   GET /api/posts/:id/comments
// @access  Public
export const getPostComments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'approved' } = req.query;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const Comment = mongoose.model('Comment');
    const comments = await Comment.find({
      post: post._id,
      parent: null,
      status
    })
      .populate({
        path: 'replies',
        match: { status },
        populate: {
          path: 'replies',
          match: { status }
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Comment.countDocuments({
      post: post._id,
      parent: null,
      status
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalComments: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get post comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get comments'
    });
  }
};

// @desc    Get posts by author
// @route   GET /api/posts/author/:username
// @access  Public
export const getPostsByAuthor = async (req, res) => {
  try {
    const { username } = req.params;
    const {
      page = 1,
      limit = 10,
      status = 'published'
    } = req.query;

    // Find author
    const author = await User.findOne({ username });
    
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    const startIndex = (page - 1) * limit;

    // Get posts
    const posts = await Post.find({
      author: author._id,
      status
    })
      .populate('category', 'name slug color')
      .sort({ publishedDate: -1 })
      .limit(limit * 1)
      .skip(startIndex)
      .lean();

    const total = await Post.countDocuments({
      author: author._id,
      status
    });

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
        author: {
          id: author._id,
          username: author.username,
          firstName: author.firstName,
          lastName: author.lastName,
          avatar: author.avatar,
          bio: author.bio,
          stats: author.stats
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
    console.error('Get posts by author error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get author posts'
    });
  }
};

// @desc    Get posts by category
// @route   GET /api/posts/category/:slug
// @access  Public
export const getPostsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'publishedDate',
      sortOrder = 'desc'
    } = req.query;

    // Find category
    const category = await Category.findOne({ slug });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const startIndex = (page - 1) * limit;

    // Build query
    const query = {
      category: category._id,
      status: 'published'
    };

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get posts
    const posts = await Post.find(query)
      .populate('author', 'firstName lastName username avatar')
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
    console.error('Get posts by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category posts'
    });
  }
};

// @desc    Get posts by tag
// @route   GET /api/posts/tag/:slug
// @access  Public
export const getPostsByTag = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'publishedDate',
      sortOrder = 'desc'
    } = req.query;

    // Find tag
    const tag = await Tag.findOne({ slug });
    
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
    console.error('Get posts by tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tag posts'
    });
  }
};

// @desc    Search posts
// @route   GET /api/posts/search
// @access  Public
export const searchPosts = async (req, res) => {
  try {
    const {
      q = '',
      page = 1,
      limit = 10,
      type = 'all' // all, title, content, tags
    } = req.query;

    if (!q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build search query
    let searchQuery = {
      status: 'published',
      $text: { $search: q }
    };

    // If specific search type
    if (type !== 'all') {
      searchQuery = {
        status: 'published',
        [type]: { $regex: q, $options: 'i' }
      };
    }

    const startIndex = (page - 1) * limit;

    // Search posts
    const posts = await Post.find(searchQuery)
      .populate('author', 'firstName lastName username avatar')
      .populate('category', 'name slug color')
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit * 1)
      .skip(startIndex)
      .lean();

    const total = await Post.countDocuments(searchQuery);
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
        posts: postsWithEngagement,
        searchQuery: q,
        searchType: type,
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
    console.error('Search posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
};

// @desc    Get post analytics
// @route   GET /api/posts/:id/analytics
// @access  Private/Author
export const getPostAnalytics = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check authorization
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view analytics'
      });
    }

    // Get views by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get comment stats
    const Comment = mongoose.model('Comment');
    const commentStats = await Comment.aggregate([
      { $match: { post: post._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get engagement stats
    const engagementStats = {
      views: post.engagement.views,
      likes: post.engagement.likes.length,
      bookmarks: post.engagement.bookmarks.length,
      comments: post.comments.total,
      shares: post.engagement.shares.total,
      commentBreakdown: {
        pending: 0,
        approved: 0,
        spam: 0,
        trash: 0
      }
    };

    commentStats.forEach(stat => {
      engagementStats.commentBreakdown[stat._id] = stat.count;
    });

    // Get top referrers (you'd need to implement analytics tracking)
    const referrers = [
      { source: 'Direct', visits: Math.floor(post.engagement.views * 0.4) },
      { source: 'Google', visits: Math.floor(post.engagement.views * 0.3) },
      { source: 'Social Media', visits: Math.floor(post.engagement.views * 0.2) },
      { source: 'Other', visits: Math.floor(post.engagement.views * 0.1) }
    ];

    res.json({
      success: true,
      data: {
        overview: engagementStats,
        referrers,
        readingTime: post.readingTime,
        wordCount: post.wordCount,
        publishedDate: post.publishedDate,
        lastModified: post.lastModified
      }
    });

  } catch (error) {
    console.error('Get post analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get post analytics'
    });
  }
};

// @desc    Export posts to CSV
// @route   GET /api/posts/export/csv
// @access  Private/Admin
export const exportPostsCSV = async (req, res) => {
  try {
    const {
      status = '',
      author = '',
      category = '',
      dateFrom = '',
      dateTo = ''
    } = req.query;

    // Build query
    let query = {};
    
    if (status) query.status = status;
    if (author) query.author = author;
    if (category) query.category = category;
    
    if (dateFrom || dateTo) {
      query.publishedDate = {};
      if (dateFrom) query.publishedDate.$gte = new Date(dateFrom);
      if (dateTo) query.publishedDate.$lte = new Date(dateTo);
    }

    // Get posts
    const posts = await Post.find(query)
      .populate('author', 'firstName lastName username email')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Prepare CSV data
    const csvData = posts.map(post => ({
      Title: post.title,
      Slug: post.slug,
      Author: `${post.author.firstName} ${post.author.lastName}`,
      AuthorEmail: post.author.email,
      Category: post.category.name,
      Status: post.status,
      PublishedDate: post.publishedDate ? format(post.publishedDate, 'yyyy-MM-dd HH:mm:ss') : '',
      Views: post.engagement.views,
      Likes: post.engagement.likes.length,
      Comments: post.comments.total,
      ReadingTime: post.readingTime,
      Tags: post.tags.join(', '),
      Created: format(post.createdAt, 'yyyy-MM-dd HH:mm:ss'),
      Modified: format(post.updatedAt, 'yyyy-MM-dd HH:mm:ss')
    }));

    // Convert to CSV
    const parser = new Parser();
    const csv = parser.parse(csvData);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="posts-export-${format(new Date(), 'yyyy-MM-dd')}.csv"`);

    res.send(csv);

  } catch (error) {
    console.error('Export posts CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export posts'
    });
  }
};

// @desc    Bulk update posts status
// @route   PUT /api/posts/bulk/status
// @access  Private/Admin
export const bulkUpdateStatus = async (req, res) => {
  try {
    const { postIds, status } = req.body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Post IDs are required'
      });
    }

    if (!['draft', 'published', 'scheduled', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    let updateData = { status };
    
    if (status === 'published') {
      updateData.publishedDate = new Date();
    }

    const result = await Post.updateMany(
      { _id: { $in: postIds } },
      updateData
    );

    // Update category and tag stats
    const posts = await Post.find({ _id: { $in: postIds } });
    
    for (const post of posts) {
      // Update category stats
      const category = await Category.findById(post.category);
      if (category) {
        await category.updateStats();
      }

      // Update tag stats
      for (const tagName of post.tags) {
        const tag = await Tag.findOne({ name: tagName });
        if (tag) {
          await tag.updateStats();
        }
      }
    }

    res.json({
      success: true,
      message: `${result.modifiedCount} posts updated successfully`
    });

  } catch (error) {
    console.error('Bulk update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update posts'
    });
  }
};

// @desc    Bulk delete posts
// @route   DELETE /api/posts/bulk
// @access  Private/Admin
export const bulkDeletePosts = async (req, res) => {
  try {
    const { postIds } = req.body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Post IDs are required'
      });
    }

    // Get posts to delete featured images
    const posts = await Post.find({ _id: { $in: postIds } });

    // Delete featured images from cloudinary
    for (const post of posts) {
      if (post.featuredImage.publicId) {
        // await cloudinary.uploader.destroy(post.featuredImage.publicId);
      }
    }

    const result = await Post.deleteMany({
      _id: { $in: postIds }
    });

    // Update category and tag stats
    for (const post of posts) {
      // Update category stats
      const category = await Category.findById(post.category);
      if (category) {
        await category.updateStats();
      }

      // Update tag stats
      for (const tagName of post.tags) {
        const tag = await Tag.findOne({ name: tagName });
        if (tag) {
          await tag.updateStats();
        }
      }
    }

    res.json({
      success: true,
      message: `${result.deletedCount} posts deleted successfully`
    });

  } catch (error) {
    console.error('Bulk delete posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk delete posts'
    });
  }
};

// @desc    Get scheduled posts that should be published
// @route   GET /api/posts/scheduled/publish
// @access  Private/System (cron job)
export const publishScheduledPosts = async (req, res) => {
  try {
    const now = new Date();

    // Find posts that should be published
    const scheduledPosts = await Post.find({
      status: 'scheduled',
      scheduledDate: { $lte: now }
    });

    let publishedCount = 0;

    for (const post of scheduledPosts) {
      post.status = 'published';
      post.publishedDate = now;
      await post.save();
      publishedCount++;
    }

    res.json({
      success: true,
      message: `${publishedCount} scheduled posts published successfully`
    });

  } catch (error) {
    console.error('Publish scheduled posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish scheduled posts'
    });
  }
};

// Helper functions
function generateExcerpt(content, maxLength = 150) {
  // Remove HTML tags
  const plainText = content.replace(/<[^>]*>/g, '');
  return plainText.substring(0, maxLength).trim() + '...';
}

export function generateMetaDescription(content, maxLength = 160) {
  const plainText = content.replace(/<[^>]*>/g, '');
  return plainText.substring(0, maxLength).trim();
}