import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
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
    maxlength: 200,
    default: ''
  },
  color: {
    type: String,
    default: '#1976d2' // Default Material-UI primary color
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
  timestamps: true
});

// Generate slug from name if not provided
tagSchema.pre('save', function(next) {
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

// Update tag stats
tagSchema.methods.updateStats = async function() {
  const Post = mongoose.model('Post');
  const stats = await Post.aggregate([
    { $match: { tags: this.name, status: 'published' } },
    {
      $group: {
        _id: null,
        totalPosts: { $sum: 1 },
        totalViews: { $sum: '$engagement.views' }
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

export default mongoose.model('Tag', tagSchema);