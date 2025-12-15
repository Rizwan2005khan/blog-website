import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Newsletter from '../models/NewsLetter.js';
import Settings from '../models/Setting.js';

export const cleanupOldData = async () => {
  try {
    const settings = await Settings.getSettings();
    const retentionDays = settings.backup.retention || 30;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    console.log(`Cleaning up data older than ${retentionDays} days...`);

    // Clean up old trashed comments
    const deletedComments = await Comment.deleteMany({
      status: 'trash',
      createdAt: { $lt: cutoffDate }
    });

    // Clean up old spam comments
    const deletedSpam = await Comment.deleteMany({
      status: 'spam',
      createdAt: { $lt: cutoffDate }
    });

    // Clean up bounced/complained newsletter subscribers
    const deletedSubscribers = await Newsletter.deleteMany({
      status: { $in: ['bounced', 'complained'] },
      updatedAt: { $lt: cutoffDate }
    });

    // Clean up old unpublished posts (optional)
    if (settings.performance.cleanupOldDrafts) {
      const deletedDrafts = await Post.deleteMany({
        status: 'draft',
        createdAt: { $lt: cutoffDate }
      });
      console.log(`Deleted ${deletedDrafts.deletedCount} old draft posts`);
    }

    console.log(`Cleanup completed:`);
    console.log(`- Deleted ${deletedComments.deletedCount} trashed comments`);
    console.log(`- Deleted ${deletedSpam.deletedCount} spam comments`);
    console.log(`- Deleted ${deletedSubscribers.deletedCount} problematic subscribers`);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};