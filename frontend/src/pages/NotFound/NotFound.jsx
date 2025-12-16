// src/pages/NotFound/NotFound.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  ArrowLeftIcon, 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const quickLinks = [
    {
      icon: HomeIcon,
      title: 'Homepage',
      description: 'Return to our main page',
      href: '/',
      color: 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100'
    },
    {
      icon: DocumentTextIcon,
      title: 'Blog',
      description: 'Browse our latest posts',
      href: '/blog',
      color: 'text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Contact',
      description: 'Get in touch with us',
      href: '/contact',
      color: 'text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100'
    },
    {
      icon: MagnifyingGlassIcon,
      title: 'Search',
      description: 'Find what you need',
      href: '/search',
      color: 'text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        {/* Main 404 Content */}
        <div className="text-center mb-12">
          {/* 404 Animation */}
          <div className="relative mb-8">
            <div className="text-9xl font-bold text-gray-300 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl opacity-20">
                📄
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Oops! The page you're looking for seems to have wandered off into the digital void. 
            Don't worry, it happens to the best of us.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Go Back
            </button>
            
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-lg hover:shadow-xl"
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Go Home
            </Link>
          </div>

          {/* Search Box */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search our blog..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    window.location.href = `/search?q=${encodeURIComponent(e.target.value.trim())}`;
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              to={link.href}
              className={`group p-6 rounded-xl border-2 border-gray-100 hover:border-gray-200 transition-all hover:shadow-lg ${link.color}`}
            >
              <div className="flex flex-col items-center text-center">
                <link.icon className="h-8 w-8 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  {link.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {link.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Posts Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Maybe you're looking for something recent?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* These would be dynamic in a real app */}
            {[
              {
                title: 'Getting Started with React Hooks',
                excerpt: 'Learn the fundamentals of React Hooks and how to use them effectively...',
                date: 'Dec 15, 2024',
                category: 'React'
              },
              {
                title: 'Building RESTful APIs with Node.js',
                excerpt: 'A comprehensive guide to creating robust APIs using Node.js and Express...',
                date: 'Dec 14, 2024',
                category: 'Node.js'
              },
              {
                title: 'CSS Grid vs Flexbox: When to Use What',
                excerpt: 'Understanding the differences and use cases for CSS Grid and Flexbox...',
                date: 'Dec 13, 2024',
                category: 'CSS'
              }
            ].map((post, index) => (
              <Link
                key={index}
                to={`/blog/${post.title.toLowerCase().replace(/\s+/g, '-')}`}
                className="group p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className="mb-3">
                  <span className="inline-block px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
                    {post.category}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {post.excerpt}
                </p>
                <span className="text-xs text-gray-500">{post.date}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Still can't find what you're looking for?
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium"
          >
            <EnvelopeIcon className="h-5 w-5 mr-2" />
            Contact Support
          </Link>
        </div>

        {/* Fun Elements */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <span>Fun fact:</span>
            <span className="font-medium">
              {[
                "The first computer bug was an actual moth! 🦋",
                "HTML has been around since 1993! 🕰️",
                "JavaScript was created in just 10 days! ⚡",
                "The average website lifespan is 2-3 years! 📊"
              ][Math.floor(Math.random() * 4)]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;