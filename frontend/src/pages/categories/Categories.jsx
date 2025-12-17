// src/pages/Categories/Categories.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import  categoryService  from '../../services/categories';
import  postService  from '../../services/posts';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import PostCard from '../../components/blog/PostCard';
import { 
   ChevronRight, 
   Tag, 
   Calendar
 } from 'lucide-react';

const Categories = () => {
  const { categorySlug } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;

  // Fetch all categories for sidebar
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories({ limit: 50, isActive: true })
  });

  // Fetch posts for selected category
  const { data: categoryPosts, isLoading: postsLoading, error } = useQuery({
    queryKey: ['posts', 'category', categorySlug, currentPage],
    queryFn: () => postService.getPosts({
      category: categorySlug,
      page: currentPage,
      limit: postsPerPage,
      status: 'published'
    }),
    enabled: !!categorySlug
  });

  // Fetch current category details
  const { data: currentCategory } = useQuery({
    queryKey: ['category', categorySlug],
    queryFn: () => categoryService.getCategoryBySlug(categorySlug),
    enabled: !!categorySlug
  });

  if (categoriesLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-700">
              Home
            </Link>
            < ChevronRight className="h-4 w-4 text-gray-400" />
            <Link to="/categories" className="text-gray-500 hover:text-gray-700">
              Categories
            </Link>
            {categorySlug && currentCategory && (
              <>
                < ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900 font-medium">{currentCategory.name}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Category List */}
          <aside className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse Categories</h2>
              
              <div className="space-y-2">
                <Link
                  to="/categories"
                  className={`block px-3 py-2 rounded-lg transition-colors ${
                    !categorySlug 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All Categories
                </Link>

                {categories?.data?.map((category) => (
                  <Link
                    key={category._id}
                    to={`/categories/${category.slug}`}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      categorySlug === category.slug
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {category.postCount || 0}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Category Stats */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total Categories:</span>
                    <span className="font-medium">{categories?.pagination?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Categories:</span>
                    <span className="font-medium">
                      {categories?.data?.filter(cat => cat.isActive).length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Popular Tags */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {['React', 'JavaScript', 'Node.js', 'MongoDB', 'CSS', 'HTML'].map((tag) => (
                  <Link
                    key={tag}
                    to={`/tags/${tag.toLowerCase()}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                  >
                    < Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:w-3/4">
            {/* Category Header */}
            {categorySlug && currentCategory && (
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentCategory.name}
                    </h1>
                    {currentCategory.description && (
                      <p className="text-gray-600 mb-4">{currentCategory.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        < Calendar className="h-4 w-4" />
                        Created {new Date(currentCategory.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        < Tag className="h-4 w-4" />
                        {categoryPosts?.pagination?.total || 0} posts
                      </span>
                    </div>
                  </div>
                  {currentCategory.image && (
                    <img
                      src={currentCategory.image}
                      alt={currentCategory.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Posts Grid */}
            {categorySlug ? (
              // Show posts for selected category
              <div>
                {postsLoading && <LoadingSpinner />}
                {error && <ErrorMessage message="Failed to load posts" />}
                
                {categoryPosts?.data && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {categoryPosts.data.map((post) => (
                        <PostCard key={post._id} post={post} />
                      ))}
                    </div>

                    {/* Pagination */}
                    {categoryPosts.pagination && categoryPosts.pagination.totalPages > 1 && (
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
                            Page {currentPage} of {categoryPosts.pagination.totalPages}
                          </span>
                          
                          <button
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={currentPage === categoryPosts.pagination.totalPages}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    )}
                  </>
                )}

                {categoryPosts?.data?.length === 0 && !postsLoading && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      < Tag className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No posts found
                    </h3>
                    <p className="text-gray-600">
                      There are no posts in this category yet.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Show all categories overview
              <div>
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Blog Categories
                  </h1>
                  <p className="text-gray-600">
                    Browse our content organized by categories. Click on any category to view related posts.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories?.data?.map((category) => (
                    <Link
                      key={category._id}
                      to={`/categories/${category.slug}`}
                      className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {category.name}
                        </h3>
                      </div>
                      
                      {category.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {category.postCount || 0} posts
                        </span>
                        < ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Categories;