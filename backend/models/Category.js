import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50,
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
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
    index: true
  },
  image: {
    url: {
      type: String,
      default: ''
    },
    alt: {
      type: String,
      default: ''
    },
    publicId: {
      type: String,
      default: ''
    }
  },
  color: {
    type: String,
    default: '#1976d2' // Default Material-UI primary color
  },
  icon: {
    type: String,
    default: '' // Material-UI icon name
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
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  stats: {
    totalPosts: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
categorySchema.index({ parent: 1, status: 1 });
categorySchema.index({ sortOrder: 1 });

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Generate slug from name if not provided
categorySchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }
  next();
});

// Update category stats when posts are added/removed
categorySchema.methods.updateStats = async function() {
  const Post = mongoose.model('Post');
  const stats = await Post.aggregate([
    { $match: { category: this._id, status: 'published' } },
    {
      $group: {
        _id: null,
        totalPosts: { $sum: 1 },
        totalViews: { $sum: '$views' }
      }
    }
  ]);
  
  if (stats.length > 0) {
    this.stats.totalPosts = stats[0].totalPosts;
    this.stats.totalViews = stats[0].totalViews;
  } else {
    this.stats.totalPosts = 0;
    this.stats.totalViews = 0;
  }
  
  await this.save();
};

export default mongoose.model('Category', categorySchema);