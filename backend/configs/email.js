import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { format } from 'date-fns';

// Email providers configuration
const emailProviders = {
  smtp: {
    name: 'SMTP',
    setup: () => {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5
      });
    }
  },
  sendgrid: {
    name: 'SendGrid',
    setup: () => {
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SendGrid API key not configured');
      }
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      return sgMail;
    }
  }
};

// Get email provider
export const getEmailProvider = (provider = 'smtp') => {
  const emailConfig = emailProviders[provider];
  if (!emailConfig) {
    throw new Error(`Email provider '${provider}' not supported`);
  }
  return emailConfig.setup();
};

// Email templates
export const emailTemplates = {
  welcome: {
    subject: 'Welcome to {{siteName}}!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: {{primaryColor}};">Welcome to {{siteName}}!</h1>
        <p>Hi {{firstName}},</p>
        <p>Thank you for joining our community. We're excited to have you on board!</p>
        <p>If you have any questions, feel free to reach out to us.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          The {{siteName}} Team
        </p>
      </div>
    `
  },
  
  newsletterVerification: {
    subject: 'Confirm your subscription to {{siteName}} Newsletter',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: {{primaryColor}};">Welcome to {{siteName}} Newsletter!</h1>
        <p>Thank you for subscribing to our newsletter. Please confirm your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{verificationUrl}}" style="background-color: {{primaryColor}}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Confirm Subscription</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: {{primaryColor}};">{{verificationUrl}}</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 14px;">
          You received this email because you subscribed to our newsletter. 
          <a href="{{unsubscribeUrl}}" style="color: {{primaryColor}};">Unsubscribe</a> anytime.
        </p>
      </div>
    `
  },
  
  commentReply: {
    subject: 'New reply to your comment on {{postTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: {{primaryColor}};">New Reply to Your Comment</h1>
        <p>Hi {{firstName}},</p>
        <p>{{replyAuthor}} replied to your comment on the article "<a href="{{postUrl}}" style="color: {{primaryColor}};">{{postTitle}}</a>":</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Your comment:</strong></p>
          <p>{{originalComment}}</p>
          <hr>
          <p><strong>{{replyAuthor}} replied:</strong></p>
          <p>{{replyContent}}</p>
        </div>
        <p><a href="{{postUrl}}#comments" style="background-color: {{primaryColor}}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Reply</a></p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          The {{siteName}} Team
        </p>
      </div>
    `
  },
  
  newPostNotification: {
    subject: '📝 New Post: {{postTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: {{primaryColor}};">New Post Published!</h1>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #333;">{{postTitle}}</h2>
          <p style="color: #666; font-size: 14px;">
            By {{authorName}} • {{publishDate}}
          </p>
          <p style="margin: 15px 0;">{{postExcerpt}}</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{postUrl}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Read Full Post</a>
          </div>
        </div>
        <p>We think you'll enjoy this post. Let us know what you think in the comments!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 14px;">
          You're receiving this because you subscribed to our newsletter. 
          <a href="{{unsubscribeUrl}}" style="color: {{primaryColor}};">Unsubscribe</a> anytime.
        </p>
      </div>
    `
  }
};

// Send email function
export const sendEmail = async (emailData) => {
  try {
    const provider = emailData.provider || 'smtp';
    const emailClient = getEmailProvider(provider);
    
    const email = {
      from: emailData.from || `"${process.env.SITE_NAME}" <${process.env.SMTP_USER}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || stripHtml(emailData.html),
      attachments: emailData.attachments || []
    };

    let result;
    
    if (provider === 'sendgrid') {
      result = await emailClient.send(email);
    } else {
      result = await emailClient.sendMail(email);
    }

    console.log(`Email sent successfully to ${emailData.to}`);
    return result;

  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Send templated email
export const sendTemplatedEmail = async (templateName, data) => {
  try {
    const template = emailTemplates[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    // Replace template variables
    let html = template.html;
    let subject = template.subject;
    
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, data[key]);
      subject = subject.replace(regex, data[key]);
    });

    await sendEmail({
      to: data.to,
      subject: subject,
      html: html,
      from: data.from
    });

  } catch (error) {
    console.error('Templated email error:', error);
    throw error;
  }
};

// Strip HTML for text version
const stripHtml = (html) => {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
};

// Email queue (for bulk emails)
class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  add(emailData) {
    this.queue.push(emailData);
    if (!this.processing) {
      this.process();
    }
  }

  async process() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const emailData = this.queue.shift();
      
      try {
        await sendEmail(emailData);
        console.log(`Email queued and sent to ${emailData.to}`);
      } catch (error) {
        console.error(`Failed to send queued email to ${emailData.to}:`, error);
        // Could implement retry logic here
      }
      
      // Add delay between emails to respect rate limits
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    this.processing = false;
  }
}

export const emailQueue = new EmailQueue();

// Test email configuration
export const testEmailConfiguration = async () => {
  try {
    const provider = getEmailProvider();
    
    if (process.env.SENDGRID_API_KEY) {
      // Test SendGrid
      await provider.send({
        to: process.env.SMTP_USER,
        from: process.env.SMTP_USER,
        subject: 'Test Email from Blog CMS',
        text: 'This is a test email to verify email configuration.'
      });
    } else {
      // Test SMTP
      await provider.verify();
    }
    
    console.log('✅ Email configuration test passed');
    return true;
    
  } catch (error) {
    console.error('❌ Email configuration test failed:', error);
    return false;
  }
};