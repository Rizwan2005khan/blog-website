import Settings from '../models/Setting.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { format } from 'date-fns';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private/Admin
export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    // Remove sensitive data
    const sanitizedSettings = {
      ...settings.toObject(),
      email: {
        ...settings.email,
        smtp: {
          ...settings.email.smtp,
          password: settings.email.smtp.password ? '••••••••' : ''
        }
      },
      newsletter: {
        ...settings.newsletter,
        apiKey: settings.newsletter.apiKey ? '••••••••' : ''
      },
      security: {
        ...settings.security,
        recaptchaSecretKey: settings.security.recaptchaSecretKey ? '••••••••' : ''
      }
    };

    res.json({
      success: true,
      data: sanitizedSettings
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings'
    });
  }
};

// @desc    Update general settings
// @route   PUT /api/settings/general
// @access  Private/Admin
export const updateGeneralSettings = async (req, res) => {
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
      description,
      keywords,
      logo,
      favicon,
      url,
      email,
      phone,
      address
    } = req.body;

    const settings = await Settings.getSettings();

    // Update site settings
    settings.site = {
      ...settings.site,
      ...(title && { title }),
      ...(description && { description }),
      ...(keywords && { keywords }),
      ...(logo && { logo }),
      ...(favicon && { favicon }),
      ...(url && { url }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(address && { address })
    };

    await settings.save();

    res.json({
      success: true,
      message: 'General settings updated successfully',
      data: {
        site: settings.site
      }
    });

  } catch (error) {
    console.error('Update general settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update general settings'
    });
  }
};

// @desc    Update SEO settings
// @route   PUT /api/settings/seo
// @access  Private/Admin
export const updateSEOSettings = async (req, res) => {
  try {
    const {
      defaultMetaTitle,
      defaultMetaDescription,
      defaultMetaKeywords,
      googleAnalyticsId,
      googleSiteVerification,
      bingSiteVerification,
      robotsTxt,
      sitemapEnabled,
      schemaMarkup
    } = req.body;

    const settings = await Settings.getSettings();

    // Update SEO settings
    settings.seo = {
      ...settings.seo,
      ...(defaultMetaTitle !== undefined && { defaultMetaTitle }),
      ...(defaultMetaDescription !== undefined && { defaultMetaDescription }),
      ...(defaultMetaKeywords && { defaultMetaKeywords }),
      ...(googleAnalyticsId !== undefined && { googleAnalyticsId }),
      ...(googleSiteVerification !== undefined && { googleSiteVerification }),
      ...(bingSiteVerification !== undefined && { bingSiteVerification }),
      ...(robotsTxt !== undefined && { robotsTxt }),
      ...(sitemapEnabled !== undefined && { sitemapEnabled }),
      ...(schemaMarkup && { schemaMarkup })
    };

    await settings.save();

    // Generate robots.txt
    await generateRobotsTxt(settings.seo.robotsTxt);

    // Generate sitemap if enabled
    if (settings.seo.sitemapEnabled) {
      await generateSitemap();
    }

    res.json({
      success: true,
      message: 'SEO settings updated successfully',
      data: {
        seo: settings.seo
      }
    });

  } catch (error) {
    console.error('Update SEO settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update SEO settings'
    });
  }
};

// @desc    Update social media settings
// @route   PUT /api/settings/social
// @access  Private/Admin
export const updateSocialSettings = async (req, res) => {
  try {
    const {
      facebook,
      twitter,
      instagram,
      linkedin,
      youtube,
      github
    } = req.body;

    const settings = await Settings.getSettings();

    // Update social settings
    settings.social = {
      ...settings.social,
      ...(facebook && { facebook }),
      ...(twitter && { twitter }),
      ...(instagram && { instagram }),
      ...(linkedin && { linkedin }),
      ...(youtube && { youtube }),
      ...(github && { github })
    };

    await settings.save();

    res.json({
      success: true,
      message: 'Social media settings updated successfully',
      data: {
        social: settings.social
      }
    });

  } catch (error) {
    console.error('Update social settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update social media settings'
    });
  }
};

// @desc    Update comment settings
// @route   PUT /api/settings/comments
// @access  Private/Admin
export const updateCommentSettings = async (req, res) => {
  try {
    const {
      enabled,
      moderation,
      requireApproval,
      allowAnonymous,
      akismetEnabled,
      akismetKey
    } = req.body;

    const settings = await Settings.getSettings();

    // Update comment settings
    settings.comments = {
      ...settings.comments,
      ...(enabled !== undefined && { enabled }),
      ...(moderation && { moderation }),
      ...(requireApproval !== undefined && { requireApproval }),
      ...(allowAnonymous !== undefined && { allowAnonymous }),
      ...(akismetEnabled !== undefined && { akismetEnabled }),
      ...(akismetKey !== undefined && { akismetKey })
    };

    await settings.save();

    res.json({
      success: true,
      message: 'Comment settings updated successfully',
      data: {
        comments: settings.comments
      }
    });

  } catch (error) {
    console.error('Update comment settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment settings'
    });
  }
};

// @desc    Update newsletter settings
// @route   PUT /api/settings/newsletter
// @access  Private/Admin
export const updateNewsletterSettings = async (req, res) => {
  try {
    const {
      enabled,
      provider,
      apiKey,
      listId,
      fromEmail,
      fromName
    } = req.body;

    const settings = await Settings.getSettings();

    // Update newsletter settings
    settings.newsletter = {
      ...settings.newsletter,
      ...(enabled !== undefined && { enabled }),
      ...(provider && { provider }),
      ...(apiKey !== undefined && { apiKey }),
      ...(listId !== undefined && { listId }),
      ...(fromEmail !== undefined && { fromEmail }),
      ...(fromName !== undefined && { fromName })
    };

    await settings.save();

    res.json({
      success: true,
      message: 'Newsletter settings updated successfully',
      data: {
        newsletter: settings.newsletter
      }
    });

  } catch (error) {
    console.error('Update newsletter settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update newsletter settings'
    });
  }
};

// @desc    Update email settings
// @route   PUT /api/settings/email
// @access  Private/Admin
export const updateEmailSettings = async (req, res) => {
  try {
    const {
      smtp,
      templates
    } = req.body;

    const settings = await Settings.getSettings();

    // Update email settings
    if (smtp) {
      settings.email.smtp = {
        ...settings.email.smtp,
        ...smtp
      };
    }

    if (templates) {
      settings.email.templates = {
        ...settings.email.templates,
        ...templates
      };
    }

    await settings.save();

    // Test SMTP connection if password provided
    if (smtp?.password) {
      try {
        const testTransporter = nodemailer.createTransport({
          host: settings.email.smtp.host,
          port: settings.email.smtp.port,
          secure: settings.email.smtp.secure,
          auth: {
            user: settings.email.smtp.user,
            pass: smtp.password
          }
        });

        await testTransporter.verify();
      } catch (smtpError) {
        console.error('SMTP test failed:', smtpError);
        return res.status(400).json({
          success: false,
          message: 'SMTP settings saved but connection test failed',
          error: smtpError.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Email settings updated successfully',
      data: {
        email: {
          ...settings.email,
          smtp: {
            ...settings.email.smtp,
            password: settings.email.smtp.password ? '••••••••' : ''
          }
        }
      }
    });

  } catch (error) {
    console.error('Update email settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email settings'
    });
  }
};

// @desc    Update appearance settings
// @route   PUT /api/settings/appearance
// @access  Private/Admin
export const updateAppearanceSettings = async (req, res) => {
  try {
    const {
      theme,
      primaryColor,
      secondaryColor,
      fontFamily,
      fontSize,
      layout,
      sidebarPosition,
      postsPerPage,
      showExcerpt,
      showAuthor,
      showDate,
      showCategories,
      showTags,
      showComments,
      showSocialShare
    } = req.body;

    const settings = await Settings.getSettings();

    // Update appearance settings
    settings.appearance = {
      ...settings.appearance,
      ...(theme && { theme }),
      ...(primaryColor && { primaryColor }),
      ...(secondaryColor && { secondaryColor }),
      ...(fontFamily && { fontFamily }),
      ...(fontSize && { fontSize }),
      ...(layout && { layout }),
      ...(sidebarPosition && { sidebarPosition }),
      ...(postsPerPage && { postsPerPage }),
      ...(showExcerpt !== undefined && { showExcerpt }),
      ...(showAuthor !== undefined && { showAuthor }),
      ...(showDate !== undefined && { showDate }),
      ...(showCategories !== undefined && { showCategories }),
      ...(showTags !== undefined && { showTags }),
      ...(showComments !== undefined && { showComments }),
      ...(showSocialShare !== undefined && { showSocialShare })
    };

    await settings.save();

    // Generate CSS variables file
    await generateCSSVariables(settings.appearance);

    res.json({
      success: true,
      message: 'Appearance settings updated successfully',
      data: {
        appearance: settings.appearance
      }
    });

  } catch (error) {
    console.error('Update appearance settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appearance settings'
    });
  }
};

// @desc    Update security settings
// @route   PUT /api/settings/security
// @access  Private/Admin
export const updateSecuritySettings = async (req, res) => {
  try {
    const {
      enableRegistration,
      emailVerification,
      recaptchaEnabled,
      recaptchaSiteKey,
      recaptchaSecretKey,
      loginAttempts,
      lockoutTime,
      passwordMinLength,
      passwordRequireUppercase,
      passwordRequireLowercase,
      passwordRequireNumbers,
      passwordRequireSpecial
    } = req.body;

    const settings = await Settings.getSettings();

    // Update security settings
    settings.security = {
      ...settings.security,
      ...(enableRegistration !== undefined && { enableRegistration }),
      ...(emailVerification !== undefined && { emailVerification }),
      ...(recaptchaEnabled !== undefined && { recaptchaEnabled }),
      ...(recaptchaSiteKey !== undefined && { recaptchaSiteKey }),
      ...(recaptchaSecretKey !== undefined && { recaptchaSecretKey }),
      ...(loginAttempts && { loginAttempts }),
      ...(lockoutTime && { lockoutTime }),
      ...(passwordMinLength && { passwordMinLength }),
      ...(passwordRequireUppercase !== undefined && { passwordRequireUppercase }),
      ...(passwordRequireLowercase !== undefined && { passwordRequireLowercase }),
      ...(passwordRequireNumbers !== undefined && { passwordRequireNumbers }),
      ...(passwordRequireSpecial !== undefined && { passwordRequireSpecial })
    };

    await settings.save();

    res.json({
      success: true,
      message: 'Security settings updated successfully',
      data: {
        security: {
          ...settings.security,
          recaptchaSecretKey: settings.security.recaptchaSecretKey ? '••••••••' : ''
        }
      }
    });

  } catch (error) {
    console.error('Update security settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update security settings'
    });
  }
};

// @desc    Update performance settings
// @route   PUT /api/settings/performance
// @access  Private/Admin
export const updatePerformanceSettings = async (req, res) => {
  try {
    const {
      cacheEnabled,
      cacheDuration,
      imageOptimization,
      lazyLoading,
      cdnEnabled,
      cdnUrl
    } = req.body;

    const settings = await Settings.getSettings();

    // Update performance settings
    settings.performance = {
      ...settings.performance,
      ...(cacheEnabled !== undefined && { cacheEnabled }),
      ...(cacheDuration && { cacheDuration }),
      ...(imageOptimization !== undefined && { imageOptimization }),
      ...(lazyLoading !== undefined && { lazyLoading }),
      ...(cdnEnabled !== undefined && { cdnEnabled }),
      ...(cdnUrl !== undefined && { cdnUrl })
    };

    await settings.save();

    res.json({
      success: true,
      message: 'Performance settings updated successfully',
      data: {
        performance: settings.performance
      }
    });

  } catch (error) {
    console.error('Update performance settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update performance settings'
    });
  }
};

// @desc    Update backup settings
// @route   PUT /api/settings/backup
// @access  Private/Admin
export const updateBackupSettings = async (req, res) => {
  try {
    const {
      enabled,
      frequency,
      retention,
      lastBackup
    } = req.body;

    const settings = await Settings.getSettings();

    // Update backup settings
    settings.backup = {
      ...settings.backup,
      ...(enabled !== undefined && { enabled }),
      ...(frequency && { frequency }),
      ...(retention && { retention }),
      ...(lastBackup && { lastBackup })
    };

    await settings.save();

    res.json({
      success: true,
      message: 'Backup settings updated successfully',
      data: {
        backup: settings.backup
      }
    });

  } catch (error) {
    console.error('Update backup settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update backup settings'
    });
  }
};

// @desc    Upload site logo
// @route   POST /api/settings/upload/logo
// @access  Private/Admin
export const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const settings = await Settings.getSettings();

    // Delete old logo if exists
    if (settings.site.logo.publicId) {
      // await deleteFromCloudinary(settings.site.logo.publicId);
    }

    // Process and optimize image
    const processedImage = await processUploadedImage(req.file, {
      width: 300,
      height: 100,
      fit: 'inside'
    });

    // Upload to cloud storage (implement your cloud storage logic)
    const uploadedImage = await uploadToCloudStorage(processedImage, 'logos');

    // Update settings
    settings.site.logo = {
      url: uploadedImage.url,
      alt: `${settings.site.title} Logo`,
      publicId: uploadedImage.publicId
    };

    await settings.save();

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        logo: settings.site.logo
      }
    });

  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload logo'
    });
  }
};

// @desc    Upload site favicon
// @route   POST /api/settings/upload/favicon
// @access  Private/Admin
export const uploadFavicon = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const settings = await Settings.getSettings();

    // Delete old favicon if exists
    if (settings.site.favicon.publicId) {
      // await deleteFromCloudinary(settings.site.favicon.publicId);
    }

    // Process and optimize image for favicon
    const processedImage = await processUploadedImage(req.file, {
      width: 64,
      height: 64,
      fit: 'cover'
    });

    // Generate multiple favicon sizes
    const faviconSizes = [16, 32, 64, 128, 192, 512];
    const faviconUrls = {};

    for (const size of faviconSizes) {
      const resizedImage = await sharp(processedImage.buffer)
        .resize(size, size)
        .png()
        .toBuffer();

      const uploadedFavicon = await uploadToCloudStorage({
        buffer: resizedImage,
        originalname: `favicon-${size}x${size}.png`,
        mimetype: 'image/png'
      }, 'favicons');

      faviconUrls[`${size}x${size}`] = uploadedFavicon.url;
    }

    // Update settings
    settings.site.favicon = {
      url: faviconUrls['64x64'], // Default favicon
      publicId: processedImage.publicId,
      sizes: faviconUrls
    };

    await settings.save();

    // Generate favicon HTML code
    const faviconHTML = generateFaviconHTML(faviconUrls);

    res.json({
      success: true,
      message: 'Favicon uploaded successfully',
      data: {
        favicon: settings.site.favicon,
        html: faviconHTML
      }
    });

  } catch (error) {
    console.error('Upload favicon error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload favicon'
    });
  }
};

// @desc    Reset settings to defaults
// @route   POST /api/settings/reset
// @access  Private/Admin
export const resetSettings = async (req, res) => {
  try {
    const { section = 'all' } = req.body;

    const settings = await Settings.getSettings();

    if (section === 'all') {
      // Reset all settings to defaults
      await Settings.deleteMany({});
      const newSettings = await Settings.create({});
      
      res.json({
        success: true,
        message: 'All settings reset to defaults successfully',
        data: newSettings
      });
    } else {
      // Reset specific section
      const defaultSettings = getDefaultSettingsForSection(section);
      
      if (!defaultSettings) {
        return res.status(400).json({
          success: false,
          message: 'Invalid section specified'
        });
      }

      settings[section] = defaultSettings;
      await settings.save();

      res.json({
        success: true,
        message: `${section} settings reset to defaults successfully`,
        data: {
          [section]: settings[section]
        }
      });
    }

  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset settings'
    });
  }
};

// @desc    Get system status
// @route   GET /api/settings/system-status
// @access  Private/Admin
export const getSystemStatus = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    // Get various system metrics
    const [
      totalUsers,
      activeUsers,
      totalPosts,
      publishedPosts,
      totalCategories,
      activeCategories,
      totalComments,
      pendingComments,
      totalSubscribers,
      activeSubscribers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Post.countDocuments(),
      Post.countDocuments({ status: 'published' }),
      Category.countDocuments(),
      Category.countDocuments({ status: 'active' }),
      Comment.countDocuments(),
      Comment.countDocuments({ status: 'pending' }),
      Newsletter.countDocuments(),
      Newsletter.countDocuments({ status: 'active' })
    ]);

    // Get recent activity
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      recentUsers,
      recentPosts,
      recentComments,
      recentSubscribers
    ] = await Promise.all([
      User.find({ createdAt: { $gte: lastWeek } }).countDocuments(),
      Post.find({ createdAt: { $gte: lastWeek } }).countDocuments(),
      Comment.find({ createdAt: { $gte: lastWeek } }).countDocuments(),
      Newsletter.find({ createdAt: { $gte: lastWeek } }).countDocuments()
    ]);

    // Get system info
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpuCount: require('os').cpus().length,
      loadAverage: require('os').loadavg()
    };

    // Check service status
    const services = {
      database: await checkDatabaseConnection(),
      email: await checkEmailService(settings),
      cache: await checkCacheService(settings),
      storage: await checkStorageService(settings)
    };

    res.json({
      success: true,
      data: {
        overview: {
          users: { total: totalUsers, active: activeUsers, recent: recentUsers },
          posts: { total: totalPosts, published: publishedPosts, recent: recentPosts },
          categories: { total: totalCategories, active: activeCategories },
          comments: { total: totalComments, pending: pendingComments, recent: recentComments },
          subscribers: { total: totalSubscribers, active: activeSubscribers, recent: recentSubscribers }
        },
        system: systemInfo,
        services,
        lastBackup: settings.backup.lastBackup,
        settings: {
          cacheEnabled: settings.performance.cacheEnabled,
          imageOptimization: settings.performance.imageOptimization,
          cdnEnabled: settings.performance.cdnEnabled
        }
      }
    });

  } catch (error) {
    console.error('Get system status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system status'
    });
  }
};

// @desc    Export settings
// @route   GET /api/settings/export
// @access  Private/Admin
export const exportSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    // Remove sensitive data
    const exportData = {
      ...settings.toObject(),
      email: {
        ...settings.email,
        smtp: {
          ...settings.email.smtp,
          password: '[REDACTED]'
        }
      },
      newsletter: {
        ...settings.newsletter,
        apiKey: '[REDACTED]'
      },
      security: {
        ...settings.security,
        recaptchaSecretKey: '[REDACTED]'
      }
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="settings-export-${format(new Date(), 'yyyy-MM-dd')}.json"`);

    res.json(exportData);

  } catch (error) {
    console.error('Export settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export settings'
    });
  }
};

// @desc    Import settings
// @route   POST /api/settings/import
// @access  Private/Admin
export const importSettings = async (req, res) => {
  try {
    const { settings: importData, merge = false } = req.body;

    if (!importData || typeof importData !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Valid settings data is required'
      });
    }

    const settings = await Settings.getSettings();

    if (!merge) {
      // Replace all settings
      Object.assign(settings, importData);
    } else {
      // Merge settings (preserve existing values not in import)
      for (const [key, value] of Object.entries(importData)) {
        if (settings[key] !== undefined && typeof value === 'object' && !Array.isArray(value)) {
          settings[key] = { ...settings[key], ...value };
        } else {
          settings[key] = value;
        }
      }
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Settings imported successfully',
      data: {
        importedSections: Object.keys(importData),
        mergeMode: merge
      }
    });

  } catch (error) {
    console.error('Import settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import settings'
    });
  }
};

// @desc    Get email templates
// @route   GET /api/settings/email-templates
// @access  Private/Admin
export const getEmailTemplates = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    res.json({
      success: true,
      data: settings.email.templates
    });

  } catch (error) {
    console.error('Get email templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email templates'
    });
  }
};

// @desc    Update email template
// @route   PUT /api/settings/email-templates/:template
// @access  Private/Admin
export const updateEmailTemplate = async (req, res) => {
  try {
    const { template } = req.params;
    const { subject, body } = req.body;

    const settings = await Settings.getSettings();

    if (!settings.email.templates[template]) {
      return res.status(404).json({
        success: false,
        message: `Email template '${template}' not found`
      });
    }

    // Update template
    if (subject !== undefined) {
      settings.email.templates[template].subject = subject;
    }
    if (body !== undefined) {
      settings.email.templates[template].body = body;
    }

    await settings.save();

    res.json({
      success: true,
      message: `Email template '${template}' updated successfully`,
      data: settings.email.templates[template]
    });

  } catch (error) {
    console.error('Update email template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email template'
    });
  }
};

// @desc    Test email configuration
// @route   POST /api/settings/test-email
// @access  Private/Admin
export const testEmailConfiguration = async (req, res) => {
  try {
    const { email, template = 'welcome' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Test email address is required'
      });
    }

    const settings = await Settings.getSettings();
    
    // Configure email transporter with current settings
    const testTransporter = nodemailer.createTransport({
      host: settings.email.smtp.host,
      port: settings.email.smtp.port,
      secure: settings.email.smtp.secure,
      auth: {
        user: settings.email.smtp.user,
        pass: settings.email.smtp.password || process.env.SMTP_PASS
      }
    });

    // Test connection
    await testTransporter.verify();

    // Send test email
    const templateData = settings.email.templates[template] || settings.email.templates.welcome;
    
    const testEmail = {
      from: `"${settings.site.title}" <${settings.email.smtp.user}>`,
      to: email,
      subject: `[TEST] ${templateData.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1976d2;">Test Email</h1>
          <p>This is a test email to verify your email configuration.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Template: ${template}</h3>
            <p><strong>Subject:</strong> ${templateData.subject}</p>
            <p><strong>Content:</strong></p>
            <div>${templateData.body}</div>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you received this email, your email configuration is working correctly!
          </p>
        </div>
      `
    };

    await testTransporter.sendMail(testEmail);

    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: {
        testEmail: email,
        template: template,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Test email configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Email configuration test failed',
      error: error.message
    });
  }
};

// @desc    Get maintenance mode status
// @route   GET /api/settings/maintenance
// @access  Public
export const getMaintenanceStatus = async (req, res) => {
  try {
    // Check if maintenance file exists
    const maintenanceFile = path.join(process.cwd(), 'maintenance.json');
    
    let maintenanceMode = false;
    let maintenanceData = null;

    try {
      const fileContent = await fs.readFile(maintenanceFile, 'utf8');
      maintenanceData = JSON.parse(fileContent);
      maintenanceMode = true;
    } catch (fileError) {
      // File doesn't exist or is invalid - maintenance mode is off
      maintenanceMode = false;
    }

    res.json({
      success: true,
      data: {
        maintenanceMode,
        ...maintenanceData
      }
    });

  } catch (error) {
    console.error('Get maintenance status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get maintenance status'
    });
  }
};

// @desc    Toggle maintenance mode
// @route   POST /api/settings/maintenance
// @access  Private/Admin
export const toggleMaintenanceMode = async (req, res) => {
  try {
    const { enable, message = 'Site is under maintenance', estimatedCompletion } = req.body;
    
    const maintenanceFile = path.join(process.cwd(), 'maintenance.json');

    if (enable) {
      // Enable maintenance mode
      const maintenanceData = {
        enabled: true,
        message,
        estimatedCompletion,
        startedAt: new Date().toISOString()
      };

      await fs.writeFile(maintenanceFile, JSON.stringify(maintenanceData, null, 2));
    } else {
      // Disable maintenance mode
      try {
        await fs.unlink(maintenanceFile);
      } catch (unlinkError) {
        // File might not exist, which is fine
      }
    }

    res.json({
      success: true,
      message: `Maintenance mode ${enable ? 'enabled' : 'disabled'} successfully`,
      data: {
        maintenanceMode: enable,
        message,
        estimatedCompletion
      }
    });

  } catch (error) {
    console.error('Toggle maintenance mode error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle maintenance mode'
    });
  }
};

// Helper functions

// Generate robots.txt
async function generateRobotsTxt(content) {
  try {
    const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
    await fs.writeFile(robotsPath, content);
  } catch (error) {
    console.error('Generate robots.txt error:', error);
  }
}

// Generate sitemap
async function generateSitemap() {
  try {
    // This would generate an actual XML sitemap
    // For now, we'll create a basic one
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${process.env.FRONTEND_URL}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
    </urlset>`;

    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    await fs.writeFile(sitemapPath, sitemapContent);
  } catch (error) {
    console.error('Generate sitemap error:', error);
  }
}

// Generate CSS variables
async function generateCSSVariables(appearance) {
  try {
    const cssContent = `
:root {
  --primary-color: ${appearance.primaryColor};
  --secondary-color: ${appearance.secondaryColor};
  --font-family: ${appearance.fontFamily};
  --font-size: ${appearance.fontSize};
  --posts-per-page: ${appearance.postsPerPage};
}
    `;

    const cssPath = path.join(process.cwd(), 'public', 'css', 'variables.css');
    await fs.writeFile(cssPath, cssContent);
  } catch (error) {
    console.error('Generate CSS variables error:', error);
  }
}

// Generate favicon HTML
function generateFaviconHTML(faviconUrls) {
  let html = '';
  
  const sizes = [
    { size: '16x16', rel: 'icon' },
    { size: '32x32', rel: 'icon' },
    { size: '192x192', rel: 'icon' },
    { size: '512x512', rel: 'icon' }
  ];

  sizes.forEach(({ size, rel }) => {
    if (faviconUrls[size]) {
      html += `<link rel="${rel}" type="image/png" sizes="${size}" href="${faviconUrls[size]}">\n`;
    }
  });

  return html.trim();
}

// Get default settings for section
function getDefaultSettingsForSection(section) {
  const defaults = {
    site: {
      title: 'My Blog',
      description: 'A modern blog built with MERN stack',
      keywords: ['blog', 'technology', 'lifestyle'],
      logo: { url: '', alt: '', publicId: '' },
      favicon: { url: '', publicId: '', sizes: {} },
      url: 'http://localhost:3000',
      email: '',
      phone: '',
      address: ''
    },
    seo: {
      defaultMetaTitle: '',
      defaultMetaDescription: '',
      defaultMetaKeywords: [],
      googleAnalyticsId: '',
      googleSiteVerification: '',
      bingSiteVerification: '',
      robotsTxt: 'User-agent: *\nDisallow: /admin/\nAllow: /',
      sitemapEnabled: true,
      schemaMarkup: {}
    },
    social: {
      facebook: { url: '', appId: '' },
      twitter: { url: '', username: '' },
      instagram: { url: '' },
      linkedin: { url: '' },
      youtube: { url: '' },
      github: { url: '' }
    },
    comments: {
      enabled: true,
      moderation: 'manual',
      requireApproval: true,
      allowAnonymous: true,
      akismetEnabled: false,
      akismetKey: ''
    },
    newsletter: {
      enabled: true,
      provider: 'custom',
      apiKey: '',
      listId: '',
      fromEmail: '',
      fromName: ''
    },
    email: {
      smtp: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        user: '',
        password: ''
      },
      templates: {
        welcome: {
          subject: 'Welcome to our blog!',
          body: 'Welcome to our community. Thanks for subscribing!'
        },
        commentReply: {
          subject: 'New reply to your comment',
          body: 'Someone replied to your comment.'
        },
        newPost: {
          subject: 'New post published!',
          body: 'Check out our latest post.'
        }
      }
    },
    appearance: {
      theme: 'light',
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e',
      fontFamily: 'Roboto, Arial, sans-serif',
      fontSize: 'medium',
      layout: 'modern',
      sidebarPosition: 'right',
      postsPerPage: 10,
      showExcerpt: true,
      showAuthor: true,
      showDate: true,
      showCategories: true,
      showTags: true,
      showComments: true,
      showSocialShare: true
    },
    security: {
      enableRegistration: true,
      emailVerification: true,
      recaptchaEnabled: false,
      recaptchaSiteKey: '',
      recaptchaSecretKey: '',
      loginAttempts: 5,
      lockoutTime: 30,
      passwordMinLength: 6,
      passwordRequireUppercase: false,
      passwordRequireLowercase: true,
      passwordRequireNumbers: false,
      passwordRequireSpecial: false
    },
    performance: {
      cacheEnabled: true,
      cacheDuration: 3600,
      imageOptimization: true,
      lazyLoading: true,
      cdnEnabled: false,
      cdnUrl: ''
    },
    backup: {
      enabled: true,
      frequency: 'weekly',
      retention: 30,
      lastBackup: null
    }
  };

  return defaults[section];
}

// Process uploaded image
async function processUploadedImage(file, options = {}) {
  try {
    const {
      width = null,
      height = null,
      fit = 'cover',
      quality = 85,
      format = 'webp'
    } = options;

    let buffer = file.buffer;

    // Process with Sharp
    const image = sharp(buffer);

    // Resize if dimensions provided
    if (width || height) {
      image.resize(width, height, { 
        fit: fit,
        withoutEnlargement: true 
      });
    }

    // Convert to specified format
    if (format === 'webp') {
      buffer = await image.webp({ quality }).toBuffer();
    } else if (format === 'jpeg') {
      buffer = await image.jpeg({ quality }).toBuffer();
    } else if (format === 'png') {
      buffer = await image.png({ quality }).toBuffer();
    }

    return {
      buffer,
      originalname: file.originalname,
      mimetype: `image/${format}`,
      size: buffer.length
    };
  } catch (error) {
    console.error('Process uploaded image error:', error);
    throw error;
  }
}

// Check database connection
async function checkDatabaseConnection() {
  try {
    const mongoose = await import('mongoose');
    const state = mongoose.connection.readyState;
    return {
      status: state === 1 ? 'connected' : 'disconnected',
      readyState: state
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

// Check email service
async function checkEmailService(settings) {
  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: settings.email.smtp.host,
      port: settings.email.smtp.port,
      secure: settings.email.smtp.secure,
      auth: {
        user: settings.email.smtp.user,
        pass: settings.email.smtp.password || process.env.SMTP_PASS
      }
    });

    await transporter.verify();
    return { status: 'connected' };
  } catch (error) {
    return { 
      status: 'error', 
      error: error.message 
    };
  }
}

// Check cache service (placeholder for Redis/Memcached)
async function checkCacheService(settings) {
  try {
    // Placeholder - implement based on your cache provider
    if (settings.performance.cacheEnabled) {
      return { status: 'enabled' };
    }
    return { status: 'disabled' };
  } catch (error) {
    return { 
      status: 'error', 
      error: error.message 
    };
  }
}

// Check storage service (placeholder for cloud storage)
async function checkStorageService(settings) {
  try {
    // Placeholder - implement based on your storage provider
    return { status: 'connected' };
  } catch (error) {
    return { 
      status: 'error', 
      error: error.message 
    };
  }
}

// Upload to cloud storage (placeholder)
async function uploadToCloudStorage(file, folder) {
  // Implement your cloud storage logic here
  // This is a placeholder that returns mock data
  return {
    url: `https://example.com/${folder}/${file.originalname}`,
    publicId: `mock-${Date.now()}`,
    secure_url: `https://example.com/${folder}/${file.originalname}`
  };
}