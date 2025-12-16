import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  UserIcon,
  CalendarIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const PostListItem = ({ post }) => {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Post Image */}
        <div className="md:w-1/3 relative">
          <img
            src={post.featuredImage || 'https://via.placeholder.com/400x250'}
            alt={post.title}
            className="w-full h-48 md:h-full object-cover"
          />
          <div className="absolute top-4 left-4">
            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
              {post.category?.name || 'Uncategorized'}
            </span>
          </div>
        </div>

        {/* Post Content */}
        <div className="md:w-2/3 p-6">
          {/* Post Title */}
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
            <Link to={`/post/${post.slug}`}>
              {post.title}
            </Link>
          </h3>

          {/* Post Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center space-x-1">
              <UserIcon className="h-4 w-4" />
              <span>{post.author?.username || 'Unknown'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-4 w-4" />
              <time dateTime={post.createdAt}>
                {format(new Date(post.createdAt), 'MMM dd, yyyy')}
              </time>
            </div>
            <div className="flex items-center space-x-1">
              <EyeIcon className="h-4 w-4" />
              <span>{post.views || 0} views</span>
            </div>
            <div className="flex items-center space-x-1">
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              <span>{post.commentsCount || 0} comments</span>
            </div>
          </div>

          {/* Post Excerpt */}
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
            {post.excerpt || post.content.substring(0, 200) + '...'}
          </p>

          {/* Post Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.slice(0, 4).map((tag, index) => (
                <Link
                  key={index}
                  to={`/tags/${tag}`}
                  className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  <TagIcon className="h-3 w-3 mr-1" />
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Read More Button */}
          <div className="flex justify-end">
            <Link
              to={`/post/${post.slug}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Read More
              <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostListItem;