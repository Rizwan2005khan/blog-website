import Post from '../models/Post.js';

export const publishScheduledPosts = async () => {
  try {
    const now = new Date();
    
    // Find posts that should be published
    const scheduledPosts = await Post.find({
      status: 'scheduled',
      scheduledDate: { $lte: now }
    });

    if (scheduledPosts.length === 0) {
      console.log('No scheduled posts to publish');
      return;
    }

    let publishedCount = 0;

    for (const post of scheduledPosts) {
      post.status = 'published';
      post.publishedDate = now;
      await post.save();
      publishedCount++;
      
      console.log(`Published scheduled post: ${post.title}`);
    }

    console.log(`Successfully published ${publishedCount} scheduled posts`);
    
  } catch (error) {
    console.error('Error publishing scheduled posts:', error);
  }
};