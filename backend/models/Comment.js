import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  author: {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    website: {
      type: String,
      default: '',
      trim: true
    },
    ipAddress: {
      type: String,
      default: '',
      index: true
    },
    userAgent: {
      type: String,
      default: ''
    }
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
    index: true
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'spam', 'trash'],
    default: 'pending',
    index: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  moderationNotes: {
    type: String,
    default: '',
    maxlength: 1000
  },
  akismetData: {
    spam: {
      type: Boolean,
      default: false
    },
    spamScore: {
      type: Number,
      default: 0
    },
    apiResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    replies: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
commentSchema.index({ post: 1, status: 1, createdAt: -1 });
commentSchema.index({ parent: 1, status: 1 });
commentSchema.index({ 'author.email': 1, status: 1 });
commentSchema.index({ createdAt: -1 });

// Virtual for nested comments
commentSchema.virtual('isReply').get(function() {
  return this.parent !== null;
});

// Virtual for comment depth
commentSchema.virtual('depth').get(function() {
  return this.parent ? 1 : 0; // Simplified depth calculation
});

// Pre-save middleware to update parent comment's replies
commentSchema.pre('save', async function(next) {
  if (this.isNew && this.parent) {
    try {
      const parentComment = await this.model('Comment').findById(this.parent);
      if (parentComment && !parentComment.replies.includes(this._id)) {
        parentComment.replies.push(this._id);
        await parentComment.save();
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Method to toggle like
commentSchema.methods.toggleLike = async function(userId) {
  const likeIndex = this.likes.indexOf(userId);
  const dislikeIndex = this.dislikes.indexOf(userId);
  
  if (likeIndex === -1) {
    this.likes.push(userId);
    // Remove from dislikes if exists
    if (dislikeIndex !== -1) {
      this.dislikes.splice(dislikeIndex, 1);
    }
  } else {
    this.likes.splice(likeIndex, 1);
  }
  
  return this.save();
};

// Method to toggle dislike
commentSchema.methods.toggleDislike = async function(userId) {
  const dislikeIndex = this.dislikes.indexOf(userId);
  const likeIndex = this.likes.indexOf(userId);
  
  if (dislikeIndex === -1) {
    this.dislikes.push(userId);
    // Remove from likes if exists
    if (likeIndex !== -1) {
      this.likes.splice(likeIndex, 1);
    }
  } else {
    this.dislikes.splice(dislikeIndex, 1);
  }
  
  return this.save();
};

// Method to mark as spam
commentSchema.methods.markAsSpam = async function() {
  this.status = 'spam';
  this.akismetData.spam = true;
  return this.save();
};

// Method to approve comment
commentSchema.methods.approve = async function() {
  this.status = 'approved';
  return this.save();
};

// Static method to get comment tree for a post
commentSchema.statics.getCommentTree = async function(postId, status = 'approved') {
  const comments = await this.find({ post: postId, status, parent: null })
    .populate({
      path: 'replies',
      match: { status },
      populate: {
        path: 'replies',
        match: { status }
      }
    })
    .sort({ createdAt: -1 });
  
  return comments;
};

// Static method to get comment count for posts
commentSchema.statics.getCommentCounts = async function(postIds) {
  const counts = await this.aggregate([
    { $match: { post: { $in: postIds }, status: 'approved' } },
    { $group: { _id: '$post', count: { $sum: 1 } } }
  ]);
  
  const countMap = {};
  counts.forEach(count => {
    countMap[count._id.toString()] = count.count;
  });
  
  return countMap;
};

export default mongoose.model('Comment', commentSchema);