import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  UserIcon, 
  CalendarIcon, 
  EyeIcon,
  ChatBubbleLeftRightIcon,
  TagIcon 
} from '@heroicons/react/24/outline';

const PostCard = ({ post }) => {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
      {/* Post Image */}
      <div className="relative overflow-hidden">
        <img
          src={post.featuredImage || 'https://via.placeholder.com/400x250'}
          alt={post.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4">
          <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
            {post.category?.name || 'Uncategorized'}
          </span>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-6">
        {/* Post Meta */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center space-x-2">
            <UserIcon className="h-4 w-4" />
            <span>{post.author?.username || 'Unknown'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4" />
            <time dateTime={post.createdAt}>
              {format(new Date(post.createdAt), 'MMM dd, yyyy')}
            </time>
          </div>
        </div>

        {/* Post Title */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
          <Link to={`/post/${post.slug}`}>
            {post.title}
          </Link>
        </h3>

        {/* Post Excerpt */}
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
          {post.excerpt || post.content.substring(0, 150) + '...'}
        </p>

        {/* Post Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag, index) => (
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

        {/* Post Stats and Read More */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <EyeIcon className="h-4 w-4" />
              <span>{post.views || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              <span>{post.commentsCount || 0}</span>
            </div>
          </div>
          
          <Link
            to={`/post/${post.slug}`}
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm transition-colors duration-200"
          >
            Read More
            <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
};

export default PostCard;