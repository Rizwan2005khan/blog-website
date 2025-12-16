import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import {
  CalendarIcon,
  UserIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  TagIcon,
  ShareIcon,
  HeartIcon,
  BookmarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon
} from '@heroicons/react/24/solid';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CommentSection from '../../components/blog/CommentSection';
import PostCard from '../../components/blog/PostCard';
import { useAuth } from '../../context/AuthContext';

const Post = () => {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Fetch post details
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', slug],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/posts/${slug}`);
      if (!response.ok) throw new Error('Post not found');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch related posts
  const { data: relatedPosts = [] } = useQuery({
    queryKey: ['posts', 'related', post?.category?.slug],
    queryFn: async () => {
      if (!post?.category?.slug) return [];
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/posts?category=${post.category.slug}&limit=4&exclude=${post._id}`
      );
      if (!response.ok) throw new Error('Failed to fetch related posts');
      return response.json();
    },
    enabled: !!post?.category?.slug,
    staleTime: 10 * 60 * 1000,
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async (postId) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to like post');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['post', slug], (old) => ({
        ...old,
        likes: data.likes,
        isLiked: data.isLiked,
      }));
      setIsLiked(data.isLiked);
    },
    onError: () => {
      toast.error('Please login to like posts');
    },
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async (postId) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/posts/${postId}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to bookmark post');
      return response.json();
    },
    onSuccess: (data) => {
      setIsBookmarked(data.isBookmarked);
      toast.success(data.isBookmarked ? 'Post bookmarked!' : 'Bookmark removed');
    },
    onError: () => {
      toast.error('Please login to bookmark posts');
    },
  });

  // Update view count
  useEffect(() => {
    if (post) {
      const updateViews = async () => {
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/posts/${post._id}/view`, {
            method: 'POST',
          });
        } catch (error) {
          console.error('Failed to update view count:', error);
        }
      };
      updateViews();
    }
  }, [post]);

  // Set initial like/bookmark states
  useEffect(() => {
    if (post && user) {
      setIsLiked(post.isLiked || false);
      setIsBookmarked(post.isBookmarked || false);
    }
  }, [post, user]);

  const handleLike = () => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }
    likeMutation.mutate(post._id);
  };

  const handleBookmark = () => {
    if (!user) {
      toast.error('Please login to bookmark posts');
      return;
    }
    bookmarkMutation.mutate(post._id);
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = post?.title || '';
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
        break;
    }
    setShowShareMenu(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Post Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <>
      <Helmet>
        <title>{post.title} - Blog CMS</title>
        <meta name="description" content={post.excerpt || post.content.substring(0, 160)} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || post.content.substring(0, 160)} />
        <meta property="og:image" content={post.featuredImage} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={post.createdAt} />
        <meta property="article:author" content={post.author.username} />
        <meta property="article:tag" content={post.tags.join(', ')} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400">
                Home
              </Link>
              <span>/</span>
              <Link to="/blog" className="hover:text-blue-600 dark:hover:text-blue-400">
                Blog
              </Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-gray-300">{post.title}</span>
            </nav>

            {/* Post Header */}
            <header className="mb-8">
              {/* Category Badge */}
              <div className="mb-4">
                <Link
                  to={`/categories/${post.category?.slug}`}
                  className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200"
                >
                  {post.category?.name || 'Uncategorized'}
                </Link>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                {post.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    {post.author.avatar ? (
                      <img
                        src={post.author.avatar}
                        alt={post.author.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Link
                      to={`/authors/${post.author.username}`}
                      className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {post.author.username}
                    </Link>
                    <p className="text-sm">
                      {new Date(post.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <EyeIcon className="h-5 w-5" />
                    <span>{post.views} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    <span>{post.commentsCount} comments</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag, index) => (
                    <Link
                      key={index}
                      to={`/tags/${tag}`}
                      className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                    >
                      <TagIcon className="h-4 w-4 mr-1" />
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-y border-gray-200 dark:border-gray-700 py-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleLike}
                    disabled={likeMutation.isLoading}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                      isLiked
                        ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {isLiked ? (
                      <HeartSolidIcon className="h-5 w-5" />
                    ) : (
                      <HeartIcon className="h-5 w-5" />
                    )}
                    <span>{post.likes || 0}</span>
                  </button>

                  <button
                    onClick={handleBookmark}
                    disabled={bookmarkMutation.isLoading}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                      isBookmarked
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {isBookmarked ? (
                      <BookmarkSolidIcon className="h-5 w-5" />
                    ) : (
                      <BookmarkIcon className="h-5 w-5" />
                    )}
                    <span>Save</span>
                  </button>
                </div>

                {/* Share Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <ShareIcon className="h-5 w-5" />
                    <span>Share</span>
                  </button>

                  {showShareMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
                      <button
                        onClick={() => handleShare('twitter')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        Share on Twitter
                      </button>
                      <button
                        onClick={() => handleShare('facebook')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        Share on Facebook
                      </button>
                      <button
                        onClick={() => handleShare('linkedin')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        Share on LinkedIn
                      </button>
                      <button
                        onClick={() => handleShare('copy')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        Copy Link
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Featured Image */}
            {post.featuredImage && (
              <div className="mb-8">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow-lg"
                />
              </div>
            )}

            {/* Post Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(post.content)
                }}
                className="text-gray-800 dark:text-gray-200 leading-relaxed"
              />
            </div>

            {/* Author Bio */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                  {post.author.avatar ? (
                    <img
                      src={post.author.avatar}
                      alt={post.author.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <UserIcon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Written by {post.author.username}
                  </h3>
                  {post.author.bio && (
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {post.author.bio}
                    </p>
                  )}
                  <Link
                    to={`/authors/${post.author.username}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                  >
                    View all posts by {post.author.username} →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="max-w-7xl mx-auto mb-12">
              <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Related Posts
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {relatedPosts.map((relatedPost) => (
                    <PostCard key={relatedPost._id} post={relatedPost} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="max-w-4xl mx-auto">
            <CommentSection postId={post._id} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Post;