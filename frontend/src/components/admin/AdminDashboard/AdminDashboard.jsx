import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  UserPlus,
  FilePlus,
  MessageCircle,
  Eye,
  Calendar
} from 'lucide-react';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const AdminDashboard = () => {
  // Fetch recent posts
  const { data: recentPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'recent', 'admin'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/posts?limit=5&sort=-createdAt`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch recent posts');
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch recent users
  const { data: recentUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users', 'recent', 'admin'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users?limit=5&sort=-createdAt`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch recent users');
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch recent comments
  const { data: recentComments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', 'recent', 'admin'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/comments?limit=5&sort=-createdAt`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch recent comments');
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch analytics data
  const { data: analytics = {} } = useQuery({
    queryKey: ['analytics', 'admin'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const stats = [
    {
      name: 'Posts This Week',
      value: analytics.postsThisWeek || 0,
      change: analytics.postsChange || 0,
      icon: FilePlus,
      color: 'blue'
    },
    {
      name: 'New Users This Week',
      value: analytics.usersThisWeek || 0,
      change: analytics.usersChange || 0,
      icon: UserPlus,
      color: 'green'
    },
    {
      name: 'Comments This Week',
      value: analytics.commentsThisWeek || 0,
      change: analytics.commentsChange || 0,
      icon: MessageCircle,
      color: 'purple'
    },
    {
      name: 'Total Views This Week',
      value: analytics.viewsThisWeek || 0,
      change: analytics.viewsChange || 0,
      icon: Eye,
      color: 'yellow'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
      green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
      purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
      yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
    };
    return colors[color] || colors.blue;
  };

  if (postsLoading || usersLoading || commentsLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  {stat.change > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${
                    stat.change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {Math.abs(stat.change)}%
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                    vs last week
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-full ${getColorClasses(stat.color)}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Posts
            </h3>
          </div>
          <div className="p-6">
            {recentPosts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No recent posts
              </p>
            ) : (
              <div className="space-y-4">
                {recentPosts.map((post) => (
                  <div key={post._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {post.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        by {post.author.username} • {format(new Date(post.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <EyeIcon className="h-3 w-3 mr-1" />
                        {post.views}
                      </div>
                      <div className="flex items-center">
                        <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
                        {post.commentsCount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Users
            </h3>
          </div>
          <div className="p-6">
            {recentUsers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No recent users
              </p>
            ) : (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user._id} className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(user.createdAt), 'MMM dd')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Comments */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Comments
          </h3>
        </div>
        <div className="p-6">
          {recentComments.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No recent comments
            </p>
          ) : (
            <div className="space-y-4">
              {recentComments.map((comment) => (
                <div key={comment._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                        {comment.author?.avatar ? (
                          <img
                            src={comment.author.avatar}
                            alt={comment.author.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {comment.author?.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          on "{comment.post?.title}"
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(comment.createdAt), 'MMM dd, HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;