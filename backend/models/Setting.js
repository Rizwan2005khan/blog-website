import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  site: {
    title: {
      type: String,
      default: 'My Blog',
      maxlength: 100
    },
    description: {
      type: String,
      default: 'A modern blog built with MERN stack',
      maxlength: 500
    },
    keywords: [{
      type: String,
      trim: true
    }],
    logo: {
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
    favicon: {
      url: {
        type: String,
        default: ''
      },
      publicId: {
        type: String,
        default: ''
      }
    },
    url: {
      type: String,
      default: 'http://localhost:3000'
    },
    email: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    }
  },
  seo: {
    defaultMetaTitle: {
      type: String,
      default: '',
      maxlength: 60
    },
    defaultMetaDescription: {
      type: String,
      default: '',
      maxlength: 160
    },
    defaultMetaKeywords: [{
      type: String,
      trim: true
    }],
    googleAnalyticsId: {
      type: String,
      default: ''
    },
    googleSiteVerification: {
      type: String,
      default: ''
    },
    bingSiteVerification: {
      type: String,
      default: ''
    },
    robotsTxt: {
      type: String,
      default: 'User-agent: *\nDisallow: /admin/\nAllow: /'
    },
    sitemapEnabled: {
      type: Boolean,
      default: true
    },
    schemaMarkup: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  social: {
    facebook: {
      url: {
        type: String,
        default: ''
      },
      appId: {
        type: String,
        default: ''
      }
    },
    twitter: {
      url: {
        type: String,
        default: ''
      },
      username: {
        type: String,
        default: ''
      }
    },
    instagram: {
      url: {
        type: String,
        default: ''
      }
    },
    linkedin: {
      url: {
        type: String,
        default: ''
      }
    },
    youtube: {
      url: {
        type: String,
        default: ''
      }
    },
    github: {
      url: {
        type: String,
        default: ''
      }
    }
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
    requireApproval: {
      type: Boolean,
      default: true
    },
    allowAnonymous: {
      type: Boolean,
      default: true
    },
    akismetEnabled: {
      type: Boolean,
      default: false
    },
    akismetKey: {
      type: String,
      default: ''
    }
  },
  newsletter: {
    enabled: {
      type: Boolean,
      default: true
    },
    provider: {
      type: String,
      enum: ['mailchimp', 'sendgrid', 'custom'],
      default: 'custom'
    },
    apiKey: {
      type: String,
      default: ''
    },
    listId: {
      type: String,
      default: ''
    },
    fromEmail: {
      type: String,
      default: ''
    },
    fromName: {
      type: String,
      default: ''
    }
  },
  email: {
    smtp: {
      host: {
        type: String,
        default: 'smtp.gmail.com'
      },
      port: {
        type: Number,
        default: 587
      },
      secure: {
        type: Boolean,
        default: false
      },
      user: {
        type: String,
        default: ''
      },
      password: {
        type: String,
        default: ''
      }
    },
    templates: {
      welcome: {
        subject: {
          type: String,
          default: 'Welcome to our blog!'
        },
        body: {
          type: String,
          default: 'Welcome to our blog! Thanks for subscribing.'
        }
      },
      commentReply: {
        subject: {
          type: String,
          default: 'New reply to your comment'
        },
        body: {
          type: String,
          default: 'Someone replied to your comment.'
        }
      },
      newPost: {
        subject: {
          type: String,
          default: 'New post published!'
        },
        body: {
          type: String,
          default: 'Check out our latest post.'
        }
      }
    }
  },
  appearance: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    primaryColor: {
      type: String,
      default: '#1976d2'
    },
    secondaryColor: {
      type: String,
      default: '#dc004e'
    },
    fontFamily: {
      type: String,
      default: 'Roboto, Arial, sans-serif'
    },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    },
    layout: {
      type: String,
      enum: ['classic', 'modern', 'minimal'],
      default: 'modern'
    },
    sidebarPosition: {
      type: String,
      enum: ['left', 'right', 'none'],
      default: 'right'
    },
    postsPerPage: {
      type: Number,
      default: 10,
      min: 1,
      max: 100
    },
    showExcerpt: {
      type: Boolean,
      default: true
    },
    showAuthor: {
      type: Boolean,
      default: true
    },
    showDate: {
      type: Boolean,
      default: true
    },
    showCategories: {
      type: Boolean,
      default: true
    },
    showTags: {
      type: Boolean,
      default: true
    },
    showComments: {
      type: Boolean,
      default: true
    },
    showSocialShare: {
      type: Boolean,
      default: true
    }
  },
  security: {
    enableRegistration: {
      type: Boolean,
      default: true
    },
    emailVerification: {
      type: Boolean,
      default: true
    },
    recaptchaEnabled: {
      type: Boolean,
      default: false
    },
    recaptchaSiteKey: {
      type: String,
      default: ''
    },
    recaptchaSecretKey: {
      type: String,
      default: ''
    },
    loginAttempts: {
      type: Number,
      default: 5
    },
    lockoutTime: {
      type: Number,
      default: 30 // minutes
    },
    passwordMinLength: {
      type: Number,
      default: 6
    },
    passwordRequireUppercase: {
      type: Boolean,
      default: false
    },
    passwordRequireLowercase: {
      type: Boolean,
      default: true
    },
    passwordRequireNumbers: {
      type: Boolean,
      default: false
    },
    passwordRequireSpecial: {
      type: Boolean,
      default: false
    }
  },
  performance: {
    cacheEnabled: {
      type: Boolean,
      default: true
    },
    cacheDuration: {
      type: Number,
      default: 3600 // 1 hour in seconds
    },
    imageOptimization: {
      type: Boolean,
      default: true
    },
    lazyLoading: {
      type: Boolean,
      default: true
    },
    cdnEnabled: {
      type: Boolean,
      default: false
    },
    cdnUrl: {
      type: String,
      default: ''
    }
  },
  backup: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    retention: {
      type: Number,
      default: 30 // days
    },
    lastBackup: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true
});

// Create single document constraint
settingsSchema.index({}, { unique: true });

// Static method to get settings
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Static method to update settings
settingsSchema.statics.updateSettings = async function(updates) {
  const settings = await this.getSettings();
  Object.assign(settings, updates);
  return settings.save();
};

export default mongoose.model('Settings', settingsSchema);