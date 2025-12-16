// src/pages/Tags/Tags.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { tagService } from '../../services/tagService';
import { postService } from '../../services/postService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import PostCard from '../../components/blog/PostCard';
import { 
  ChevronRightIcon, 
  TagIcon, 
  CalendarIcon, 
  HashtagIcon,
  FireIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Tags = () => {
  const { tagSlug } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const postsPerPage = 12;

  // Fetch all tags with post counts
  const { data: tags, isLoading: tagsLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagService.getTags({ limit: 100, isActive: true })
  });

  // Fetch popular tags
  const { data: popularTags } = useQuery({
    queryKey: ['tags', 'popular'],
    queryFn: () => tagService.getPopularTags({ limit: 20 })
  });

  // Fetch posts for selected tag
  const { data: tagPosts, isLoading: postsLoading, error } = useQuery({
    queryKey: ['posts', 'tag', tagSlug, currentPage, sortBy],
    queryFn: () => postService.getPosts({
      tag: tagSlug,
      page: currentPage,
      limit: postsPerPage,
      status: 'published',
      sort: sortBy
    }),
    enabled: !!tagSlug
  });

  // Get current tag info
  const currentTag = tagSlug ? decodeURIComponent(tagSlug) : null;

  // Calculate tag statistics
  const tagStats = React.useMemo(() => {
    if (!tags?.data) return {};
    
    const totalTags = tags.data.length;
    const activeTags = tags.data.filter(tag => tag.isActive).length;
    const totalPosts = tags.data.reduce((sum, tag) => sum + (tag.postCount || 0), 0);
    
    return { totalTags, activeTags, totalPosts };
  }, [tags]);

  if (tagsLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-700">
              Home
            </Link>
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            <Link to="/tags" className="text-gray-500 hover:text-gray-700">
              Tags
            </Link>
            {tagSlug && (
              <>
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900 font-medium">#{currentTag}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-1/4">
            {/* Tag Cloud */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TagIcon className="h-5 w-5" />
                Tag Cloud
              </h2>
              
              <div className="flex flex-wrap gap-2">
                {tags?.data?.map((tag) => {
                  const size = tag.postCount > 10 ? 'lg' : tag.postCount > 5 ? 'md' : 'sm';
                  const isActive = currentTag === tag.name;
                  
                  return (
                    <Link
                      key={tag._id}
                      to={`/tags/${encodeURIComponent(tag.name)}`}
                      className={`inline-flex items-center px-3 py-1 rounded-full font-medium transition-all hover:scale-105 ${
                        size === 'lg' ? 'text-base px-4 py-2' : 
                        size === 'md' ? 'text-sm' : 'text-xs'
                      } ${
                        isActive
                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                      style={{
                        fontSize: size === 'lg' ? '1rem' : size === 'md' ? '0.875rem' : '0.75rem'
                      }}
                    >
                      <HashtagIcon className="h-3 w-3 mr-1" />
                      {tag.name}
                      <span className="ml-1 text-xs opacity-75">
                        ({tag.postCount || 0})
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Popular Tags */}
            {popularTags?.data && popularTags.data.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FireIcon className="h-5 w-5 text-orange-500" />
                  Trending Tags
                </h3>
                
                <div className="space-y-2">
                  {popularTags.data.slice(0, 10).map((tag, index) => (
                    <Link
                      key={tag._id}
                      to={`/tags/${encodeURIComponent(tag.name)}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500 w-4">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          #{tag.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {tag.postCount || 0} posts
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tag Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tag Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Tags:</span>
                  <span className="font-semibold text-gray-900">{tagStats.totalTags || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Tags:</span>
                  <span className="font-semibold text-green-600">{tagStats.activeTags || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Posts:</span>
                  <span className="font-semibold text-blue-600">{tagStats.totalPosts || 0}</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  to="/categories"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <TagIcon className="h-4 w-4" />
                  Browse Categories
                </Link>
                <Link
                  to="/blog"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <CalendarIcon className="h-4 w-4" />
                  All Posts
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:w-3/4">
            {tagSlug ? (
              // Show posts for selected tag
              <div>
                {/* Tag Header */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        #{currentTag}
                      </h1>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <HashtagIcon className="h-4 w-4" />
                          {tagPosts?.pagination?.total || 0} posts
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          Sorted by {sortBy === 'createdAt' ? 'latest' : 'most viewed'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Sort Options */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="createdAt">Latest First</option>
                      <option value="views">Most Viewed</option>
                      <option value="title">Title A-Z</option>
                    </select>
                  </div>
                </div>

                {/* Posts Grid */}
                {postsLoading && <LoadingSpinner />}
                {error && <ErrorMessage message="Failed to load posts" />}
                
                {tagPosts?.data && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {tagPosts.data.map((post) => (
                        <PostCard key={post._id} post={post} />
                      ))}
                    </div>

                    {/* Pagination */}
                    {tagPosts.pagination && tagPosts.pagination.totalPages > 1 && (
                      <div className="flex justify-center">
                        <nav className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          
                          <span className="px-4 py-2 text-sm text-gray-700">
                            Page {currentPage} of {tagPosts.pagination.totalPages}
                          </span>
                          
                          <button
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={currentPage === tagPosts.pagination.totalPages}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    )}
                  </>
                )}

                {tagPosts?.data?.length === 0 && !postsLoading && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <HashtagIcon className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No posts found
                    </h3>
                    <p className="text-gray-600">
                      There are no posts tagged with "#{currentTag}" yet.
                    </p>
                    <Link
                      to="/tags"
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors"
                    >
                      Browse All Tags
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              // Show all tags overview
              <div>
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Browse by Tags
                  </h1>
                  <p className="text-gray-600">
                    Discover content organized by tags. Click on any tag to view related posts.
                  </p>
                </div>

                {/* Tags Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {tags?.data?.map((tag) => (
                    <Link
                      key={tag._id}
                      to={`/tags/${encodeURIComponent(tag.name)}`}
                      className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-all hover:scale-105"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          #{tag.name}
                        </h3>
                        <HashtagIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      
                      {tag.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {tag.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {tag.postCount || 0} posts
                        </span>
                        <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Popular Tags Section */}
                {popularTags?.data && popularTags.data.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FireIcon className="h-5 w-5 text-orange-500" />
                      Most Popular Tags
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {popularTags.data.slice(0, 15).map((tag) => (
                        <Link
                          key={tag._id}
                          to={`/tags/${encodeURIComponent(tag.name)}`}
                          className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 bg-orange-50 text-orange-800 hover:bg-orange-100"
                        >
                          <HashtagIcon className="h-4 w-4 mr-1" />
                          {tag.name}
                          <span className="ml-2 text-xs font-bold">
                            {tag.postCount || 0}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Tags;