import Newsletter from '../models/NewsLetter.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Settings from '../models/Setting.js';
import { validationResult } from 'express-validator';
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { format, parseISO } from 'date-fns';
import crypto from 'crypto';
import { Parser } from 'json2csv';

// Configure email services
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// SendGrid configuration (if available)
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
export const subscribe = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, firstName = '', lastName = '', preferences = {} } = req.body;

    // Check if already subscribed
    const existingSubscription = await Newsletter.findOne({ email: email.toLowerCase() });
    
    if (existingSubscription) {
      if (existingSubscription.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'You are already subscribed to our newsletter'
        });
      }
      
      if (existingSubscription.status === 'unsubscribed') {
        // Reactivate subscription
        existingSubscription.status = 'active';
        existingSubscription.firstName = firstName;
        existingSubscription.lastName = lastName;
        existingSubscription.preferences = { ...existingSubscription.preferences, ...preferences };
        existingSubscription.unsubscribe.unsubscribedAt = null;
        existingSubscription.unsubscribe.reason = '';
        
        await existingSubscription.save();
        
        return res.json({
          success: true,
          message: 'Welcome back! Your subscription has been reactivated.',
          data: {
            email: existingSubscription.email,
            status: existingSubscription.status
          }
        });
      }
    }

    // Get site settings for default preferences
    const settings = await Settings.getSettings();
    
    // Create new subscription
    const subscription = await Newsletter.create({
      email: email.toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      preferences: {
        frequency: preferences.frequency || 'weekly',
        categories: preferences.categories || [],
        tags: preferences.tags || [],
        ...preferences
      },
      source: 'website',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || ''
    });

    // Generate verification token
    const verificationToken = subscription.generateVerificationToken();
    await subscription.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/newsletter/verify/${verificationToken}`;
    
    try {
      const emailData = {
        from: `"${process.env.SITE_NAME}" <${process.env.SMTP_USER}>`,
        to: subscription.email,
        subject: `Confirm your subscription to ${process.env.SITE_NAME}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1976d2;">Welcome to ${process.env.SITE_NAME} Newsletter!</h1>
            <p>Thank you for subscribing to our newsletter. Please confirm your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #1976d2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Confirm Subscription</a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1976d2;">${verificationUrl}</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              You received this email because you subscribed to our newsletter. 
              <a href="${process.env.FRONTEND_URL}/newsletter/unsubscribe/${subscription.unsubscribe.token}" style="color: #1976d2;">Unsubscribe</a> anytime.
            </p>
          </div>
        `
      };

      await transporter.sendMail(emailData);
    } catch (emailError) {
      console.error('Verification email error:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Subscription successful! Please check your email to confirm.',
      data: {
        email: subscription.email,
        status: subscription.status,
        verificationRequired: true
      }
    });

  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe to newsletter'
    });
  }
};

// @desc    Verify newsletter subscription
// @route   GET /api/newsletter/verify/:token
// @access  Public
export const verifySubscription = async (req, res) => {
  try {
    const { token } = req.params;

    // Hash the token to match stored version
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find subscription with verification token
    const subscription = await Newsletter.findOne({
      'verification.token': hashedToken
    });

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    if (subscription.verification.verified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Mark as verified
    subscription.verification.verified = true;
    subscription.verification.verifiedAt = new Date();
    subscription.verification.token = '';
    await subscription.save();

    // Send welcome email
    try {
      const welcomeEmail = {
        from: `"${process.env.SITE_NAME}" <${process.env.SMTP_USER}>`,
        to: subscription.email,
        subject: `Welcome to ${process.env.SITE_NAME} Newsletter!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1976d2;">Welcome Aboard! 🎉</h1>
            <p>Hi ${subscription.firstName || 'there'},</p>
            <p>Thank you for confirming your subscription to our newsletter. You're now part of our community!</p>
            <p>Here's what you can expect:</p>
            <ul>
              <li>Latest blog posts and updates</li>
              <li>Exclusive content and insights</li>
              <li>Early access to new features</li>
            </ul>
            <p>We'll send you updates based on your preferences: <strong>${subscription.preferences.frequency}</strong></p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              You can manage your preferences or 
              <a href="${process.env.FRONTEND_URL}/newsletter/unsubscribe/${subscription.unsubscribe.token}" style="color: #1976d2;">unsubscribe</a> anytime.
            </p>
          </div>
        `
      };

      await transporter.sendMail(welcomeEmail);
    } catch (emailError) {
      console.error('Welcome email error:', emailError);
    }

    res.json({
      success: true,
      message: 'Email verified successfully. Welcome to our newsletter!'
    });

  } catch (error) {
    console.error('Verify subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
};

// @desc    Unsubscribe from newsletter
// @route   POST /api/newsletter/unsubscribe/:token
// @access  Public
export const unsubscribe = async (req, res) => {
  try {
    const { token } = req.params;
    const { reason = '' } = req.body;

    // Hash the token to match stored version
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find subscription with unsubscribe token
    const subscription = await Newsletter.findOne({
      'unsubscribe.token': hashedToken
    });

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: 'Invalid unsubscribe token'
      });
    }

    if (subscription.status === 'unsubscribed') {
      return res.status(400).json({
        success: false,
        message: 'Already unsubscribed'
      });
    }

    // Update subscription
    subscription.status = 'unsubscribed';
    subscription.unsubscribe.unsubscribedAt = new Date();
    subscription.unsubscribe.reason = reason;
    await subscription.save();

    // Send confirmation email
    try {
      const confirmationEmail = {
        from: `"${process.env.SITE_NAME}" <${process.env.SMTP_USER}>`,
        to: subscription.email,
        subject: `You've been unsubscribed from ${process.env.SITE_NAME}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1976d2;">We're Sorry to See You Go 😢</h1>
            <p>Hi ${subscription.firstName || 'there'},</p>
            <p>You've been successfully unsubscribed from our newsletter.</p>
            ${reason ? `<p>We appreciate your feedback: "${reason}"</p>` : ''}
            <p>If this was a mistake or you'd like to resubscribe, you can do so anytime at:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/newsletter/subscribe" style="background-color: #1976d2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">Resubscribe</a>
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              This is the last email you'll receive from our newsletter.
            </p>
          </div>
        `
      }
      await transporter.sendMail(confirmationEmail);
    } catch (emailError) {
      console.error('Unsubscribe confirmation email error:', emailError);
    }

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Unsubscribe failed'
    });
  }
};

// @desc    Get all subscribers (Admin)
// @route   GET /api/newsletter/subscribers
// @access  Private/Admin
export const getSubscribers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = '',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      verified = ''
    } = req.query;

    // Build query
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (verified !== '') {
      query['verification.verified'] = verified === 'true';
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const total = await Newsletter.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get subscribers
    const subscribers = await Newsletter.find(query)
      .select('-verification.token -unsubscribe.token')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip(startIndex);

    // Get engagement statistics
    const engagementStats = await Newsletter.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalEmailsSent: { $sum: '$engagement.totalEmailsSent' },
          totalEmailsOpened: { $sum: '$engagement.totalEmailsOpened' },
          totalLinksClicked: { $sum: '$engagement.totalLinksClicked' },
          avgOpenRate: { $avg: '$engagement.totalEmailsOpened' },
          avgClickRate: { $avg: '$engagement.totalLinksClicked' }
        }
      }
    ]);

    // Get status distribution
    const statusDistribution = await Newsletter.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusCounts = {};
    statusDistribution.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        subscribers,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalSubscribers: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        engagementStats: engagementStats[0] || {},
        statusCounts
      }
    });

  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscribers'
    });
  }
};

// @desc    Get single subscriber
// @route   GET /api/newsletter/subscribers/:id
// @access  Private/Admin
export const getSubscriberById = async (req, res) => {
  try {
    const subscriber = await Newsletter.findById(req.params.id)
      .select('-verification.token -unsubscribe.token');

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    res.json({
      success: true,
      data: subscriber
    });

  } catch (error) {
    console.error('Get subscriber by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscriber'
    });
  }
};

// @desc    Update subscriber
// @route   PUT /api/newsletter/subscribers/:id
// @access  Private/Admin
export const updateSubscriber = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      preferences,
      status,
      notes
    } = req.body;

    const subscriber = await Newsletter.findById(req.params.id);
    
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    // Update fields
    if (firstName !== undefined) subscriber.firstName = firstName;
    if (lastName !== undefined) subscriber.lastName = lastName;
    if (preferences !== undefined) subscriber.preferences = { ...subscriber.preferences, ...preferences };
    if (status !== undefined) subscriber.status = status;
    if (notes !== undefined) subscriber.notes = notes;

    await subscriber.save();

    res.json({
      success: true,
      message: 'Subscriber updated successfully',
      data: subscriber
    });

  } catch (error) {
    console.error('Update subscriber error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscriber'
    });
  }
};

// @desc    Delete subscriber
// @route   DELETE /api/newsletter/subscribers/:id
// @access  Private/Admin
export const deleteSubscriber = async (req, res) => {
  try {
    const subscriber = await Newsletter.findById(req.params.id);
    
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    await subscriber.deleteOne();

    res.json({
      success: true,
      message: 'Subscriber deleted successfully'
    });

  } catch (error) {
    console.error('Delete subscriber error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subscriber'
    });
  }
};

// @desc    Send newsletter campaign
// @route   POST /api/newsletter/campaigns
// @access  Private/Admin
export const sendCampaign = async (req, res) => {
  try {
    const {
      subject,
      content,
      template = 'default',
      recipients = 'all', // all, verified, specific, categories, tags
      recipientIds = [], // for specific recipients
      scheduledDate = null,
      testEmail = null
    } = req.body;

    // Validate input
    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Subject and content are required'
      });
    }

    // Build recipient query
    let recipientQuery = { status: 'active' };
    
    switch (recipients) {
      case 'verified':
        recipientQuery['verification.verified'] = true;
        break;
      case 'specific':
        if (!recipientIds || recipientIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Recipient IDs are required for specific recipients'
          });
        }
        recipientQuery._id = { $in: recipientIds };
        break;
      case 'categories':
        if (!recipientIds || recipientIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Category IDs are required for category-based recipients'
          });
        }
        recipientQuery['preferences.categories'] = { $in: recipientIds };
        break;
      case 'tags':
        if (!recipientIds || recipientIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Tag names are required for tag-based recipients'
          });
        }
        recipientQuery['preferences.tags'] = { $in: recipientIds };
        break;
    }

    // Get recipients
    const recipientsList = await Newsletter.find(recipientQuery);
    
    if (recipientsList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No recipients found matching the criteria'
      });
    }

    // Handle test email
    if (testEmail) {
      const testSubscriber = await Newsletter.findOne({ email: testEmail });
      if (!testSubscriber) {
        return res.status(404).json({
          success: false,
          message: 'Test email not found in subscribers'
        });
      }

      try {
        await sendNewsletterEmail(testSubscriber, subject, content, template);
        
        return res.json({
          success: true,
          message: 'Test email sent successfully',
          data: {
            testEmail,
            recipientsCount: 1
          }
        });
      } catch (emailError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send test email',
          error: emailError.message
        });
      }
    }

    // Handle scheduled campaign
    if (scheduledDate) {
      const scheduleDate = new Date(scheduledDate);
      if (scheduleDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled date must be in the future'
        });
      }

      // Store campaign for scheduled sending (you'll need a cron job)
      const campaign = {
        _id: new mongoose.Types.ObjectId(),
        subject,
        content,
        template,
        recipients: recipientsList.map(r => r._id),
        scheduledDate: scheduleDate,
        status: 'scheduled',
        createdBy: req.user.id,
        createdAt: new Date()
      };

      // Store in database or queue system
      // await ScheduledCampaign.create(campaign);

      return res.json({
        success: true,
        message: 'Campaign scheduled successfully',
        data: {
          campaignId: campaign._id,
          scheduledDate: scheduleDate,
          recipientsCount: recipientsList.length
        }
      });
    }

    // Send campaign immediately
    let sentCount = 0;
    let failedCount = 0;
    const errors = [];

    // Send in batches to avoid overwhelming the email service
    const batchSize = 50;
    for (let i = 0; i < recipientsList.length; i += batchSize) {
      const batch = recipientsList.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (subscriber) => {
        try {
          await sendNewsletterEmail(subscriber, subject, content, template);
          
          // Update engagement stats
          subscriber.engagement.totalEmailsSent += 1;
          await subscriber.save();
          
          sentCount++;
        } catch (emailError) {
          failedCount++;
          errors.push({
            email: subscriber.email,
            error: emailError.message
          });
        }
      });

      await Promise.all(batchPromises);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < recipientsList.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    res.json({
      success: true,
      message: `Campaign sent successfully. ${sentCount} emails sent, ${failedCount} failed.`,
      data: {
        sentCount,
        failedCount,
        totalRecipients: recipientsList.length,
        errors: errors.slice(0, 10) // Return first 10 errors
      }
    });

  } catch (error) {
    console.error('Send campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send newsletter campaign'
    });
  }
};

// @desc    Send automated new post notification
// @route   POST /api/newsletter/new-post/:postId
// @access  Private/Admin
export const sendNewPostNotification = async (req, res) => {
  try {
    const { postId } = req.params;
    const { recipientFilter = 'all', testMode = false } = req.body;

    // Find the post
    const post = await Post.findById(postId)
      .populate('author', 'firstName lastName')
      .populate('category', 'name')
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot send notification for unpublished post'
      });
    }

    // Build recipient query based on post category and tags
    let recipientQuery = { 
      status: 'active',
      'verification.verified': true
    };

    if (recipientFilter === 'category' && post.category) {
      recipientQuery['preferences.categories'] = post.category._id;
    } else if (recipientFilter === 'tags' && post.tags.length > 0) {
      recipientQuery['preferences.tags'] = { $in: post.tags };
    }

    // Get recipients
    const recipients = await Newsletter.find(recipientQuery);
    
    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No subscribers found matching the criteria'
      });
    }

    // Generate email content
    const postUrl = `${process.env.FRONTEND_URL}/post/${post.slug}`;
    const postExcerpt = post.excerpt || generateExcerpt(post.content, 200);
    
    const subject = `📝 New Post: ${post.title}`;
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1976d2;">New Post Published!</h1>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #333;">${post.title}</h2>
          <p style="color: #666; font-size: 14px;">
            By ${post.author.firstName} ${post.author.lastName} • ${format(new Date(post.publishedDate), 'MMMM dd, yyyy')}
          </p>
          <p style="margin: 15px 0;">${postExcerpt}</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${postUrl}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Read Full Post</a>
          </div>
        </div>
        <p>We think you'll enjoy this post. Let us know what you think in the comments!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 14px;">
          You're receiving this because you subscribed to our newsletter. 
          <a href="${process.env.FRONTEND_URL}/newsletter/unsubscribe" style="color: #1976d2;">Unsubscribe</a> anytime.
        </p>
      </div>
    `;

    if (testMode) {
      // Send test email to admin
      const adminUser = await User.findById(req.user.id);
      if (adminUser && adminUser.email) {
        await sendNewsletterEmail(
          { email: adminUser.email, firstName: adminUser.firstName, lastName: adminUser.lastName },
          subject,
          content,
          'new-post'
        );
      }

      return res.json({
        success: true,
        message: 'Test notification sent successfully',
        data: {
          testEmail: adminUser.email,
          recipientsCount: 1,
          postTitle: post.title
        }
      });
    }

    // Send to all recipients
    let sentCount = 0;
    let failedCount = 0;

    // Send in batches
    const batchSize = 25;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (subscriber) => {
        try {
          await sendNewsletterEmail(subscriber, subject, content, 'new-post');
          
          // Update engagement stats
          subscriber.engagement.totalEmailsSent += 1;
          await subscriber.save();
          
          sentCount++;
        } catch (emailError) {
          failedCount++;
          console.error(`Failed to send to ${subscriber.email}:`, emailError);
        }
      });

      await Promise.all(batchPromises);
      
      // Delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    res.json({
      success: true,
      message: `New post notification sent successfully. ${sentCount} emails sent, ${failedCount} failed.`,
      data: {
        sentCount,
        failedCount,
        totalRecipients: recipients.length,
        postTitle: post.title
      }
    });

  } catch (error) {
    console.error('Send new post notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send new post notification'
    });
  }
};

// @desc    Send newsletter email (helper function)
async function sendNewsletterEmail(subscriber, subject, content, template = 'default') {
  try {
    // Personalize content
    const personalizedSubject = subject.replace('[name]', subscriber.firstName || 'there');
    const personalizedContent = content.replace('[name]', subscriber.firstName || 'there');

    // Get site settings for branding
    const settings = await Settings.getSettings();
    
    // Create email data
    const emailData = {
      from: `"${settings.site.title}" <${process.env.SMTP_USER}>`,
      to: subscriber.email,
      subject: personalizedSubject,
      html: wrapEmailTemplate(personalizedContent, settings, template),
      list: {
        unsubscribe: {
          url: `${process.env.FRONTEND_URL}/newsletter/unsubscribe/${subscriber.unsubscribe.token}`,
          comment: 'Unsubscribe from our newsletter'
        }
      }
    };

    // Send email based on provider
    if (process.env.SENDGRID_API_KEY) {
      // Use SendGrid
      await sgMail.send(emailData);
    } else {
      // Use SMTP
      await transporter.sendMail(emailData);
    }

    return true;
  } catch (error) {
    console.error(`Failed to send email to ${subscriber.email}:`, error);
    throw error;
  }
}

// @desc    Wrap content in email template
function wrapEmailTemplate(content, settings, template = 'default') {
  const templates = {
    default: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${settings.site.title} Newsletter</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background-color: ${settings.appearance.primaryColor}; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background-color: ${settings.appearance.primaryColor}; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content { padding: 20px !important; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${settings.site.title}</h1>
            <p>${settings.site.description}</p>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>You're receiving this because you subscribed to our newsletter.</p>
            <p>
              <a href="${process.env.FRONTEND_URL}/newsletter/unsubscribe" style="color: ${settings.appearance.primaryColor};">Unsubscribe</a> | 
              <a href="${process.env.FRONTEND_URL}/newsletter/preferences" style="color: ${settings.appearance.primaryColor};">Update Preferences</a>
            </p>
            <p>${settings.site.title} | ${settings.site.url}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    'new-post': `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Post - ${settings.site.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; }
          .header { background: linear-gradient(135deg, ${settings.appearance.primaryColor}, ${settings.appearance.secondaryColor}); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .post-card { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: ${settings.appearance.primaryColor}; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content { padding: 20px !important; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 New Content Alert</h1>
            <p>Fresh from ${settings.site.title}</p>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>You're receiving this because you subscribed to post notifications.</p>
            <p>
              <a href="${process.env.FRONTEND_URL}/newsletter/unsubscribe" style="color: ${settings.appearance.primaryColor};">Unsubscribe</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return templates[template] || templates.default;
}

// Helper functions

// Generate excerpt from content
function generateExcerpt(content, maxLength = 150) {
  const plainText = content.replace(/<[^>]*>/g, '');
  return plainText.substring(0, maxLength).trim() + (plainText.length > maxLength ? '...' : '');
}

// Generate unsubscribe token
function generateUnsubscribeToken() {
  return crypto.randomBytes(32).toString('hex');
}

// @desc    Get newsletter analytics
// @route   GET /api/newsletter/analytics
// @access  Private/Admin
export const getNewsletterAnalytics = async (req, res) => {
  try {
    const { dateFrom = '', dateTo = '' } = req.query;

    // Build date filter
    let dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.createdAt.$lte = new Date(dateTo);
    }

    // Get overall stats
    const overallStats = await Newsletter.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalSubscribers: { $sum: 1 },
          activeSubscribers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          unsubscribedSubscribers: {
            $sum: { $cond: [{ $eq: ['$status', 'unsubscribed'] }, 1, 0] }
          },
          verifiedSubscribers: {
            $sum: { $cond: ['$verification.verified', 1, 0] }
          },
          totalEmailsSent: { $sum: '$engagement.totalEmailsSent' },
          totalEmailsOpened: { $sum: '$engagement.totalEmailsOpened' },
          totalLinksClicked: { $sum: '$engagement.totalLinksClicked' }
        }
      }
    ]);

    // Get subscribers by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const subscribersByDate = await Newsletter.aggregate([
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
          total: { $sum: 1 },
          verified: {
            $sum: { $cond: ['$verification.verified', 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get engagement by frequency preference
    const engagementByFrequency = await Newsletter.aggregate([
      { $match: { status: 'active', 'verification.verified': true } },
      {
        $group: {
          _id: '$preferences.frequency',
          subscribers: { $sum: 1 },
          avgEmailsSent: { $avg: '$engagement.totalEmailsSent' },
          avgEmailsOpened: { $avg: '$engagement.totalEmailsOpened' },
          avgLinksClicked: { $avg: '$engagement.totalLinksClicked' }
        }
      }
    ]);

    // Get top engaged subscribers
    const topEngagedSubscribers = await Newsletter.find({
      status: 'active',
      'verification.verified': true
    })
      .sort({ 'engagement.totalEmailsOpened': -1 })
      .limit(10)
      .select('firstName lastName email engagement');

    // Calculate open and click rates
    const stats = overallStats[0] || {
      totalEmailsSent: 0,
      totalEmailsOpened: 0,
      totalLinksClicked: 0
    };

    const openRate = stats.totalEmailsSent > 0 ? 
      ((stats.totalEmailsOpened / stats.totalEmailsSent) * 100).toFixed(2) : 0;
    
    const clickRate = stats.totalEmailsSent > 0 ? 
      ((stats.totalLinksClicked / stats.totalEmailsSent) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        overview: overallStats[0] || {
          totalSubscribers: 0,
          activeSubscribers: 0,
          unsubscribedSubscribers: 0,
          verifiedSubscribers: 0,
          totalEmailsSent: 0,
          totalEmailsOpened: 0,
          totalLinksClicked: 0
        },
        openRate: parseFloat(openRate),
        clickRate: parseFloat(clickRate),
        subscribersByDate,
        engagementByFrequency,
        topEngagedSubscribers
      }
    });

  } catch (error) {
    console.error('Get newsletter analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get newsletter analytics'
    });
  }
};

// @desc    Export subscribers to CSV
// @route   GET /api/newsletter/export/csv
// @access  Private/Admin
export const exportSubscribersCSV = async (req, res) => {
  try {
    const { status = '', verified = '' } = req.query;

    // Build query
    let query = {};
    if (status) query.status = status;
    if (verified !== '') query['verification.verified'] = verified === 'true';

    // Get subscribers
    const subscribers = await Newsletter.find(query)
      .select('-verification.token -unsubscribe.token')
      .sort({ createdAt: -1 })
      .lean();

    // Prepare CSV data
    const csvData = subscribers.map(subscriber => ({
      Email: subscriber.email,
      FirstName: subscriber.firstName,
      LastName: subscriber.lastName,
      Status: subscriber.status,
      Verified: subscriber.verification.verified ? 'Yes' : 'No',
      Frequency: subscriber.preferences.frequency,
      Categories: subscriber.preferences.categories.join('; '),
      Tags: subscriber.preferences.tags.join('; '),
      EmailsSent: subscriber.engagement.totalEmailsSent,
      EmailsOpened: subscriber.engagement.totalEmailsOpened,
      LinksClicked: subscriber.engagement.totalLinksClicked,
      LastEngagement: subscriber.engagement.lastEngagement ? format(subscriber.engagement.lastEngagement, 'yyyy-MM-dd HH:mm:ss') : 'Never',
      Source: subscriber.source,
      Created: format(subscriber.createdAt, 'yyyy-MM-dd HH:mm:ss'),
      Modified: format(subscriber.updatedAt, 'yyyy-MM-dd HH:mm:ss')
    }));

    // Convert to CSV
    const { Parser } = await import('json2csv');
    const parser = new Parser();
    const csv = parser.parse(csvData);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="newsletter-subscribers-${format(new Date(), 'yyyy-MM-dd')}.csv"`);

    res.send(csv);

  } catch (error) {
    console.error('Export subscribers CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export subscribers'
    });
  }
};

// @desc    Update subscriber preferences
// @route   PUT /api/newsletter/preferences
// @access  Private (subscriber via token)
export const updatePreferences = async (req, res) => {
  try {
    const { token, preferences } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Subscriber token is required'
      });
    }

    // Find subscriber by email (token is email in this case for simplicity)
    const subscriber = await Newsletter.findOne({ email: token.toLowerCase() });
    
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    // Update preferences
    subscriber.preferences = { ...subscriber.preferences, ...preferences };
    await subscriber.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        email: subscriber.email,
        preferences: subscriber.preferences
      }
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    });
  }
};

// @desc    Get subscriber preferences
// @route   GET /api/newsletter/preferences/:token
// @access  Public (subscriber via token)
export const getPreferences = async (req, res) => {
  try {
    const { token } = req.params;

    const subscriber = await Newsletter.findOne({ email: token.toLowerCase() })
      .select('email firstName lastName preferences');
    
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    res.json({
      success: true,
      data: subscriber
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get preferences'
    });
  }
};

// @desc    Bulk import subscribers
// @route   POST /api/newsletter/import
// @access  Private/Admin
export const importSubscribers = async (req, res) => {
  try {
    const { subscribers, skipDuplicates = true } = req.body;

    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Subscribers array is required'
      });
    }

    let imported = 0;
    let skipped = 0;
    let errors = [];

    for (const subscriberData of subscribers) {
      try {
        const { email, firstName = '', lastName = '', preferences = {} } = subscriberData;

        if (!email) {
          errors.push({ email: 'unknown', error: 'Email is required' });
          continue;
        }

        // Check for existing subscriber
        const existing = await Newsletter.findOne({ email: email.toLowerCase() });
        
        if (existing) {
          if (skipDuplicates) {
            skipped++;
            continue;
          } else {
            // Update existing subscriber
            existing.firstName = firstName;
            existing.lastName = lastName;
            existing.preferences = { ...existing.preferences, ...preferences };
            existing.status = 'active';
            await existing.save();
            imported++;
            continue;
          }
        }

        // Create new subscriber
        await Newsletter.create({
          email: email.toLowerCase(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          preferences,
          verification: { verified: true }, // Auto-verify imported subscribers
          source: 'import',
          ipAddress: 'import',
          userAgent: 'import'
        });

        imported++;
      } catch (error) {
        errors.push({ email: subscriberData.email, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Import completed. ${imported} imported, ${skipped} skipped, ${errors.length} errors.`,
      data: {
        imported,
        skipped,
        errors: errors.slice(0, 10) // Return first 10 errors
      }
    });

  } catch (error) {
    console.error('Import subscribers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import subscribers'
    });
  }
};

// @desc    Clean inactive subscribers
// @route   POST /api/newsletter/cleanup
// @access  Private/Admin
export const cleanupInactiveSubscribers = async (req, res) => {
  try {
    const { inactiveMonths = 6, bounceRate = 0.5, dryRun = true } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - inactiveMonths);

    // Find inactive subscribers
    const inactiveSubscribers = await Newsletter.find({
      status: 'active',
      $or: [
        { 'engagement.lastEngagement': { $lt: cutoffDate } },
        { 'engagement.lastEngagement': null },
        { status: 'bounced' },
        { status: 'complained' }
      ]
    });

    if (dryRun) {
      return res.json({
        success: true,
        message: `Cleanup dry run: ${inactiveSubscribers.length} inactive subscribers found.`,
        data: {
          totalInactive: inactiveSubscribers.length,
          subscribers: inactiveSubscribers.map(s => ({
            email: s.email,
            lastEngagement: s.engagement.lastEngagement,
            status: s.status,
            emailsSent: s.engagement.totalEmailsSent,
            emailsOpened: s.engagement.totalEmailsOpened
          }))
        }
      });
    }

    // Actually clean up
    let deletedCount = 0;
    for (const subscriber of inactiveSubscribers) {
      await subscriber.deleteOne();
      deletedCount++;
    }

    res.json({
      success: true,
      message: `Cleanup completed. ${deletedCount} inactive subscribers removed.`,
      data: {
        deletedCount
      }
    });

  } catch (error) {
    console.error('Cleanup inactive subscribers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup inactive subscribers'
    });
  }
};

// @desc    Track email open
// @route   GET /api/newsletter/track/open/:subscriberId
// @access  Public (pixel tracking)
export const trackEmailOpen = async (req, res) => {
  try {
    const { subscriberId } = req.params;
    
    const subscriber = await Newsletter.findById(subscriberId);
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    // Update engagement stats
    subscriber.engagement.totalEmailsOpened += 1;
    subscriber.engagement.lastEngagement = new Date();
    await subscriber.save();

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.send(pixel);

  } catch (error) {
    console.error('Track email open error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track email open'
    });
  }
};

// @desc    Track email click
// @route   GET /api/newsletter/track/click/:subscriberId
// @access  Public (link tracking)
export const trackEmailClick = async (req, res) => {
  try {
    const { subscriberId } = req.params;
    const { url } = req.query;

    const subscriber = await Newsletter.findById(subscriberId);
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    // Update engagement stats
    subscriber.engagement.totalLinksClicked += 1;
    subscriber.engagement.lastEngagement = new Date();
    await subscriber.save();

    // Redirect to original URL
    if (url) {
      res.redirect(decodeURIComponent(url));
    } else {
      res.redirect(process.env.FRONTEND_URL);
    }

  } catch (error) {
    console.error('Track email click error:', error);
    res.redirect(process.env.FRONTEND_URL);
  }
};

// @desc    Send weekly digest
// @route   POST /api/newsletter/weekly-digest
// @access  Private/Admin
export const sendWeeklyDigest = async (req, res) => {
  try {
    const { testMode = false, customPosts = [] } = req.body;

    // Calculate date range (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get posts from last week
    let posts = [];
    
    if (customPosts && customPosts.length > 0) {
      posts = await Post.find({ _id: { $in: customPosts }, status: 'published' })
        .populate('author', 'firstName lastName')
        .populate('category', 'name')
        .sort({ publishedDate: -1 });
    } else {
      posts = await Post.find({
        status: 'published',
        publishedDate: { $gte: sevenDaysAgo }
      })
        .populate('author', 'firstName lastName')
        .populate('category', 'name')
        .sort({ publishedDate: -1 })
        .limit(10);
    }

    if (posts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No posts found for weekly digest'
      });
    }

    // Get subscribers who want weekly updates
    const recipients = await Newsletter.find({
      status: 'active',
      'verification.verified': true,
      'preferences.frequency': 'weekly'
    });

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No weekly subscribers found'
      });
    }

    // Generate digest content
    const subject = `📰 Weekly Digest: ${posts.length} New Posts`;
    
    let postsHTML = '';
    posts.forEach(post => {
      const postUrl = `${process.env.FRONTEND_URL}/post/${post.slug}`;
      const excerpt = post.excerpt || generateExcerpt(post.content, 150);
      
      postsHTML += `
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: #333;">
            <a href="${postUrl}" style="color: #1976d2; text-decoration: none;">${post.title}</a>
          </h3>
          <p style="color: #666; font-size: 14px;">
            By ${post.author.firstName} ${post.author.lastName} • ${format(new Date(post.publishedDate), 'MMMM dd, yyyy')}
          </p>
          <p style="margin: 10px 0;">${excerpt}</p>
          <a href="${postUrl}" style="color: #1976d2; text-decoration: none; font-weight: bold;">Read more →</a>
        </div>
      `;
    });

    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1976d2;">Weekly Digest 📰</h1>
        <p>Here are the latest posts from this week that you might have missed:</p>
        
        ${postsHTML}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/blog" style="background-color: #1976d2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View All Posts</a>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 14px;">
          You're receiving this weekly digest because you subscribed to our newsletter. 
          <a href="${process.env.FRONTEND_URL}/newsletter/unsubscribe" style="color: #1976d2;">Unsubscribe</a> or 
          <a href="${process.env.FRONTEND_URL}/newsletter/preferences" style="color: #1976d2;">update preferences</a> anytime.
        </p>
      </div>
    `;

    if (testMode) {
      // Send test digest to admin
      const adminUser = await User.findById(req.user.id);
      if (adminUser && adminUser.email) {
        await sendNewsletterEmail(
          { email: adminUser.email, firstName: adminUser.firstName, lastName: adminUser.lastName },
          subject,
          content,
          'weekly-digest'
        );
      }

      return res.json({
        success: true,
        message: 'Test weekly digest sent successfully',
        data: {
          testEmail: adminUser.email,
          postsCount: posts.length
        }
      });
    }

    // Send to weekly subscribers
    let sentCount = 0;
    let failedCount = 0;

    // Send in batches
    const batchSize = 30;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (subscriber) => {
        try {
          await sendNewsletterEmail(subscriber, subject, content, 'weekly-digest');
          
          // Update engagement stats
          subscriber.engagement.totalEmailsSent += 1;
          await subscriber.save();
          
          sentCount++;
        } catch (emailError) {
          failedCount++;
          console.error(`Failed to send to ${subscriber.email}:`, emailError);
        }
      });

      await Promise.all(batchPromises);
      
      // Delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    res.json({
      success: true,
      message: `Weekly digest sent successfully. ${sentCount} emails sent, ${failedCount} failed.`,
      data: {
        sentCount,
        failedCount,
        totalRecipients: recipients.length,
        postsCount: posts.length
      }
    });

  } catch (error) {
    console.error('Send weekly digest error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send weekly digest'
    });
  }
};

// Export additional functions for use in other controllers
export {
  generateExcerpt,
  generateUnsubscribeToken
};