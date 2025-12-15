// cron/weeklyDigest.js
import Newsletter from '../models/NewsLetter.js';
import Post from '../models/Post.js';
import { sendWeeklyDigest as sendWeeklyDigestController } from '../controllers/newsletterController.js';

/**
 * Sends weekly digest emails to subscribers.
 * Fetches posts from the last 7 days and sends via controller.
 */
export const sendWeeklyDigest = async () => {
  try {
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get published posts from the last week
    const posts = await Post.find({
      status: 'published',
      publishedDate: { $gte: sevenDaysAgo }
    })
      .populate('author', 'firstName lastName')
      .populate('category', 'name')
      .sort({ publishedDate: -1 })
      .limit(10);

    if (!posts.length) {
      console.log('[Weekly Digest] No posts found in the last 7 days.');
      return;
    }

    // Get subscribers who want weekly updates
    const recipients = await Newsletter.find({
      status: 'active',
      'verification.verified': true,
      'preferences.frequency': 'weekly'
    });

    if (!recipients.length) {
      console.log('[Weekly Digest] No weekly subscribers found.');
      return;
    }

    console.log(`[Weekly Digest] Sending to ${recipients.length} subscribers.`);

    // Call controller function to send emails
    await sendWeeklyDigestController(
      {
        body: {
          testMode: false, // set true for testing
          customPosts: posts.map(p => p._id)
        },
        user: { id: 'system' } // system user
      },
      {
        json: (data) => {
          console.log('[Weekly Digest] Success:', data.message);
        },
        status: () => ({ json: () => {} })
      }
    );
  } catch (error) {
    console.error('[Weekly Digest] Error:', error);
  }
};
