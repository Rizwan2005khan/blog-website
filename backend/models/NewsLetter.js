import mongoose from 'mongoose';
import crypto from 'crypto'

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: 50,
    default: ''
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'unsubscribed', 'bounced', 'complained'],
    default: 'active',
    index: true
  },
  preferences: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],
    tags: [{
      type: String,
      trim: true
    }]
  },
  verification: {
    token: {
      type: String,
      default: ''
    },
    verified: {
      type: Boolean,
      default: false
    },
    verifiedAt: {
      type: Date,
      default: null
    }
  },
  unsubscribe: {
    token: {
      type: String,
      default: ''
    },
    reason: {
      type: String,
      maxlength: 500,
      default: ''
    },
    unsubscribedAt: {
      type: Date,
      default: null
    }
  },
  engagement: {
    totalEmailsSent: {
      type: Number,
      default: 0
    },
    totalEmailsOpened: {
      type: Number,
      default: 0
    },
    totalLinksClicked: {
      type: Number,
      default: 0
    },
    lastEngagement: {
      type: Date,
      default: null
    }
  },
  source: {
    type: String,
    enum: ['website', 'api', 'import', 'manual'],
    default: 'website'
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    maxlength: 1000,
    default: ''
  }
}, {
  timestamps: true
});

// Generate verification token
newsletterSchema.methods.generateVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.verification.token = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  return verificationToken;
};

// Generate unsubscribe token
newsletterSchema.methods.generateUnsubscribeToken = function() {
  const unsubscribeToken = crypto.randomBytes(32).toString('hex');
  this.unsubscribe.token = crypto
    .createHash('sha256')
    .update(unsubscribeToken)
    .digest('hex');
  return unsubscribeToken;
};

// Record engagement
newsletterSchema.methods.recordEngagement = function(type) {
  this.engagement.lastEngagement = new Date();
  
  switch (type) {
    case 'open':
      this.engagement.totalEmailsOpened += 1;
      break;
    case 'click':
      this.engagement.totalLinksClicked += 1;
      break;
    case 'sent':
      this.engagement.totalEmailsSent += 1;
      break;
  }
  
  return this.save();
};

export default mongoose.model('Newsletter', newsletterSchema);