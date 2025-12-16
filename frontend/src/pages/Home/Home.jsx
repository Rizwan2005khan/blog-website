import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  ArrowRightIcon, 
  CalendarIcon, 
  UserIcon, 
  TagIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PostCard from '../../components/blog/PostCard';
import TagCloud from '../../components/blog/TagCloud';

const Home = () => {
  const [featuredPostIndex, setFeaturedPostIndex] = useState(0);

  // Fetch featured posts
  const { data: featuredPosts = [], isLoading: featuredLoading } = useQuery({
    queryKey: ['posts', 'featured'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/posts?featured=true&limit=3`);
      if (!response.ok) throw new Error('Failed to fetch featured posts');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch recent posts
  const { data: recentPosts = [], isLoading: recentLoading } = useQuery({
    queryKey: ['posts', 'recent'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/posts?limit=6&sort=-createdAt`);
      if (!response.ok) throw new Error('Failed to fetch recent posts');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch popular posts
  const { data: popularPosts = [] } = useQuery({
    queryKey: ['posts', 'popular'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/posts?limit=4&sort=-views`);
      if (!response.ok) throw new Error('Failed to fetch popular posts');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'home'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories?limit=6`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ['tags', 'home'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tags?limit=20`);
      if (!response.ok) throw new Error('Failed to fetch tags');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  if (featuredLoading || recentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const currentFeaturedPost = featuredPosts[featuredPostIndex];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 dark:from-blue-800 dark:to-purple-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to <span className="text-yellow-300">BlogCMS</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Discover amazing stories, insights, and knowledge from our community of writers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/blog"
                className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                Explore Blog
              </Link>
              <Link
                to="/register"
                className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors duration-200"
              >
                Start Writing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Post Section */}
      {featuredPosts.length > 0 && currentFeaturedPost && (
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Featured Story
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Handpicked content from our editorial team
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="order-2 lg:order-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
                      Featured
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {new Date(currentFeaturedPost.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    <Link 
                      to={`/post/${currentFeaturedPost.slug}`}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                    >
                      {currentFeaturedPost.title}
                    </Link>
                  </h3>

                  <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-3">
                    {currentFeaturedPost.excerpt}
                  </p>

                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                        <UserIcon className="h-4 w-4" />
                        <span className="text-sm">{currentFeaturedPost.author.username}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                        <EyeIcon className="h-4 w-4" />
                        <span className="text-sm">{currentFeaturedPost.views}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                        <span className="text-sm">{currentFeaturedPost.commentsCount}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/post/${currentFeaturedPost.slug}`}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Read More
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                </div>

                <div className="order-1 lg:order-2">
                  <div className="relative overflow-hidden rounded-xl shadow-2xl">
                    <img
                      src={currentFeaturedPost.featuredImage || 'https://via.placeholder.com/600x400'}
                      alt={currentFeaturedPost.title}
                      className="w-full h-64 lg:h-80 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                </div>
              </div>

              {/* Featured Posts Navigation */}
              {featuredPosts.length > 1 && (
                <div className="flex justify-center mt-8 space-x-2">
                  {featuredPosts.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setFeaturedPostIndex(index)}
                      className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                        index === featuredPostIndex
                          ? 'bg-blue-600'
                          : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Recent Posts Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Latest Stories
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Fresh content from our community
                </p>
              </div>
              <Link
                to="/blog"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 mt-4 md:mt-0"
              >
                View All Posts
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentPosts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories and Tags Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Popular Categories */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Browse by Category
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {categories.map((category) => (
                    <Link
                      key={category._id}
                      to={`/categories/${category.slug}`}
                      className="group p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                    >
                      <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {category.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {category.postsCount || 0} posts
                      </p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Popular Tags */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Popular Tags
                </h3>
                <TagCloud tags={tags} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-blue-600 dark:bg-blue-800">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-3xl font-bold text-white mb-4">
              Stay Updated
            </h3>
            <p className="text-blue-100 mb-8">
              Get the latest posts delivered directly to your inbox
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;