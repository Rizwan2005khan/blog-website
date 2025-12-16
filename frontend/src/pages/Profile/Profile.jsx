import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  UserIcon,
  PencilIcon,
  CalendarIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  BookmarkIcon,
  DocumentTextIcon,
  CogIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PostCard from '../../components/blog/PostCard';
import ProfileEditForm from '../../components/profile/ProfileEditForm';
import ProfileSettings from '../../components/profile/ProfileSettings';

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user posts
  const { data: userPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'user', user?._id],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/posts/user/${user._id}`);
      if (!response.ok) throw new Error('Failed to fetch user posts');
      return response.json();
    },
    enabled: !!user?._id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user's liked posts
  const { data: likedPosts = [], isLoading: likedLoading } = useQuery({
    queryKey: ['posts', 'liked', user?._id],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/posts/liked`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch liked posts');
      return response.json();
    },
    enabled: !!user?._id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user's bookmarked posts
  const { data: bookmarkedPosts = [], isLoading: bookmarkedLoading } = useQuery({
    queryKey: ['posts', 'bookmarked', user?._id],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/posts/bookmarked`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch bookmarked posts');
      return response.json();
    },
    enabled: !!user?._id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user stats
  const { data: userStats = {} } = useQuery({
    queryKey: ['user', 'stats', user?._id],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch user stats');
      return response.json();
    },
    enabled: !!user?._id,
    staleTime: 10 * 60 * 1000,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please login to view your profile
          </h2>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'posts', name: 'My Posts', icon: DocumentTextIcon, count: userPosts.length },
    { id: 'liked', name: 'Liked Posts', icon: HeartIcon, count: likedPosts.length },
    { id: 'bookmarked', name: 'Bookmarks', icon: BookmarkIcon, count: bookmarkedPosts.length },
    { id: 'settings', name: 'Settings', icon: CogIcon, count: null },
  ];

  const getContentByTab = () => {
    switch (activeTab) {
      case 'posts':
        if (postsLoading) {
          return (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="large" />
            </div>
          );
        }
        if (userPosts.length === 0) {
          return (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No posts yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start writing and share your thoughts with the community
              </p>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                Write Your First Post
              </button>
            </div>
          );
        }
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userPosts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        );

      case 'liked':
        if (likedLoading) {
          return (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="large" />
            </div>
          );
        }
        if (likedPosts.length === 0) {
          return (
            <div className="text-center py-12">
              <HeartIcon className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No liked posts
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Like posts to see them here
              </p>
            </div>
          );
        }
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedPosts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        );

      case 'bookmarked':
        if (bookmarkedLoading) {
          return (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="large" />
            </div>
          );
        }
        if (bookmarkedPosts.length === 0) {
          return (
            <div className="text-center py-12">
              <BookmarkIcon className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No bookmarks
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Bookmark posts to save them for later
              </p>
            </div>
          );
        }
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarkedPosts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        );

      case 'settings':
        return <ProfileSettings />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors duration-200">
                  <PhotoIcon className="h-4 w-4" />
                </button>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-4 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {user.firstName || user.lastName
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : user.username}
                  </h1>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">@{user.username}</p>
                
                {user.bio && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-2xl">
                    {user.bio}
                  </p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {userStats.postsCount || 0} posts
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <EyeIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {userStats.totalViews || 0} total views
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {userStats.totalComments || 0} comments
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                  Write New Post
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Profile Edit Form (Modal-like) */}
          {isEditing && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Edit Profile
                    </h2>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <ProfileEditForm onClose={() => setIsEditing(false)} />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                    {tab.count !== null && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activeTab === tab.id
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {getContentByTab()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;