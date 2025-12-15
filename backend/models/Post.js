import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    maxlength: 500,
    default: ''
  },
  featuredImage: {
    url: {
      type: String,
      default: ''
    },
    alt: {
      type: String,
      default: ''
    },
    caption: {
      type: String,
      default: ''
    },
    publicId: {
      type: String,
      default: ''
    }
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    index: true
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'archived'],
    default: 'draft',
    index: true
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'password'],
    default: 'public'
  },
  password: {
    type: String,
    default: '' // For password-protected posts
  },
  scheduledDate: {
    type: Date,
    default: null,
    index: true
  },
  publishedDate: {
    type: Date,
    default: null,
    index: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  metaTitle: {
    type: String,
    maxlength: 60,
    default: ''
  },
  metaDescription: {
    type: String,
    maxlength: 160,
    default: ''
  },
  metaKeywords: [{
    type: String,
    trim: true
  }],
  socialSharing: {
    facebook: { type: Boolean, default: true },
    twitter: { type: Boolean, default: true },
    linkedin: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: true },
    telegram: { type: Boolean, default: true },
    reddit: { type: Boolean, default: true }
  },
  engagement: {
    views: {
      type: Number,
      default: 0,
      index: true
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    shares: {
      facebook: { type: Number, default: 0 },
      twitter: { type: Number, default: 0 },
      linkedin: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    bookmarks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  comments: {
    enabled: {
      type: Boolean,
      default: true
    },
    moderation: {
      type: String,
      enum: ['auto', 'manual'],
      default: 'manual'
    },
    total: {
      type: Number,
      default: 0
    }
  },
  readingTime: {
    type: Number,
    default: 0 // in minutes
  },
  wordCount: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    default: 'en',
    maxlength: 5
  },
  canonicalUrl: {
    type: String,
    default: ''
  },
  allowIndexing: {
    type: Boolean,
    default: true
  },
  structuredData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  customCss: {
    type: String,
    default: ''
  },
  customJs: {
    type: String,
    default: ''
  },
  relatedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  series: {
    name: {
      type: String,
      default: ''
    },
    part: {
      type: Number,
      default: null
    }
  },
  source: {
    type: String,
    enum: ['web', 'api', 'import'],
    default: 'web'
  },
  importId: {
    type: String,
    default: '',
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
postSchema.index({ status: 1, publishedDate: -1 });
postSchema.index({ category: 1, status: 1, publishedDate: -1 });
postSchema.index({ author: 1, status: 1 });
postSchema.index({ tags: 1, status: 1 });
postSchema.index({ 'engagement.views': -1 });
postSchema.index({ createdAt: -1 });

// Text search index
postSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

// Generate reading time and word count before saving
postSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    const wordsPerMinute = 200;
    const wordCount = this.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length;
    this.wordCount = wordCount;
    this.readingTime = Math.ceil(wordCount / wordsPerMinute);
  }
  
  this.lastModified = new Date();
  next();
});

// Generate excerpt if not provided
postSchema.pre('save', function(next) {
  if (!this.excerpt && this.content) {
    const plainText = this.content.replace(/<[^>]*>/g, '');
    this.excerpt = plainText.substring(0, 150).trim() + '...';
  }
  next();
});

// Generate slug from title if not provided
postSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }
  next();
});

// Handle status changes
postSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'published' && !this.publishedDate) {
      this.publishedDate = new Date();
    } else if (this.status === 'scheduled' && this.scheduledDate) {
      this.publishedDate = this.scheduledDate;
    }
  }
  next();
});

// Update category stats when post status changes
postSchema.post('save', async function() {
  if (this.isModified('status') || this.isModified('category')) {
    const Category = mongoose.model('Category');
    
    // Update old category stats
    if (this.isModified('category')) {
      const oldCategoryId = this.get('category');
      if (oldCategoryId) {
        const oldCategory = await Category.findById(oldCategoryId);
        if (oldCategory) {
          await oldCategory.updateStats();
        }
      }
    }
    
    // Update current category stats
    const currentCategory = await Category.findById(this.category);
    if (currentCategory) {
      await currentCategory.updateStats();
    }
  }
});

// Increment view count
postSchema.methods.incrementViews = async function() {
  this.engagement.views += 1;
  return this.save();
};

// Toggle like
postSchema.methods.toggleLike = async function(userId) {
  const likeIndex = this.engagement.likes.indexOf(userId);
  
  if (likeIndex === -1) {
    this.engagement.likes.push(userId);
  } else {
    this.engagement.likes.splice(likeIndex, 1);
  }
  
  return this.save();
};

// Add comment
postSchema.methods.addComment = async function(commentData) {
  const Comment = mongoose.model('Comment');
  const comment = new Comment({
    ...commentData,
    post: this._id
  });
  
  await comment.save();
  this.comments.total += 1;
  await this.save();
  
  return comment;
};

// Get related posts
postSchema.methods.getRelatedPosts = async function(limit = 5) {
  return this.model('Post').find({
    _id: { $ne: this._id },
    category: this.category,
    status: 'published'
  })
  .limit(limit)
  .sort({ publishedDate: -1 });
};

export default mongoose.model('Post', postSchema);