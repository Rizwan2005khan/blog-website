import { useState } from 'react';
import {
  Code,
  FileText,
  Key,
  Globe,
  Server,
  ExternalLink,
  Clipboard,
  CheckCircle
} from 'lucide-react';

const APIDocumentation = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState('auth-login');
  const [copiedCode, setCopiedCode] = useState(null);

  const endpoints = {
    'auth-login': {
      title: 'Authentication - Login',
      method: 'POST',
      path: '/api/users/login',
      description: 'Authenticate user and receive JWT token',
      parameters: {
        body: {
          email: 'string (required)',
          password: 'string (required)'
        }
      },
      response: {
        success: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            _id: 'userId',
            username: 'johndoe',
            email: 'john@example.com',
            role: 'user'
          }
        },
        error: {
          message: 'Invalid credentials'
        }
      },
      code: `// JavaScript Example
const response = await fetch('https://your-domain.com/api/users/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'yourpassword'
  })
});

const data = await response.json();
console.log(data.token); // Store this token for authenticated requests`
    },
    'posts-list': {
      title: 'Posts - List All Posts',
      method: 'GET',
      path: '/api/posts',
      description: 'Get paginated list of posts with filtering options',
      parameters: {
        query: {
          page: 'number (optional, default: 1)',
          limit: 'number (optional, default: 10)',
          category: 'string (optional)',
          tag: 'string (optional)',
          search: 'string (optional)',
          sort: 'string (optional, default: -createdAt)'
        }
      },
      response: {
        success: {
          posts: [
            {
              _id: 'postId',
              title: 'Post Title',
              excerpt: 'Post excerpt...',
              slug: 'post-slug',
              featuredImage: 'image-url',
              author: {
                _id: 'authorId',
                username: 'johndoe'
              },
              category: {
                _id: 'categoryId',
                name: 'Technology'
              },
              tags: ['react', 'javascript'],
              status: 'published',
              views: 150,
              likes: 25,
              commentsCount: 10,
              createdAt: '2024-01-15T10:00:00.000Z',
              updatedAt: '2024-01-15T10:00:00.000Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 100,
            pages: 10
          }
        }
      },
      code: `// JavaScript Example
const response = await fetch('https://your-domain.com/api/posts?page=1&limit=10&category=technology');
const data = await response.json();
console.log(data.posts); // Array of posts`
    },
    'posts-create': {
      title: 'Posts - Create New Post',
      method: 'POST',
      path: '/api/posts',
      description: 'Create a new blog post (requires authentication)',
      authentication: 'Required - Bearer Token',
      parameters: {
        headers: {
          'Authorization': 'Bearer YOUR_JWT_TOKEN'
        },
        body: {
          title: 'string (required)',
          content: 'string (required)',
          excerpt: 'string (optional)',
          category: 'string (required)',
          tags: 'array of strings (optional)',
          status: 'string (optional, default: draft)',
          featuredImage: 'file (optional)',
          metaTitle: 'string (optional)',
          metaDescription: 'string (optional)',
          allowComments: 'boolean (optional, default: true)',
          isFeatured: 'boolean (optional, default: false)'
        }
      },
      response: {
        success: {
          message: 'Post created successfully',
          post: {
            _id: 'newPostId',
            title: 'New Post Title',
            slug: 'new-post-title',
            status: 'draft',
            createdAt: '2024-01-15T10:00:00.000Z'
          }
        },
        error: {
          message: 'Validation error'
        }
      },
      code: `// JavaScript Example with FormData
const formData = new FormData();
formData.append('title', 'My New Post');
formData.append('content', '<p>Post content here</p>');
formData.append('category', 'technology');
formData.append('tags', JSON.stringify(['react', 'javascript']));
formData.append('status', 'published');

const response = await fetch('https://your-domain.com/api/posts', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: formData
});`
    },
    'users-profile': {
      title: 'Users - Get User Profile',
      method: 'GET',
      path: '/api/users/profile',
      description: 'Get current user profile information',
      authentication: 'Required - Bearer Token',
      parameters: {
        headers: {
          'Authorization': 'Bearer YOUR_JWT_TOKEN'
        }
      },
      response: {
        success: {
          _id: 'userId',
          username: 'johndoe',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'user',
          bio: 'Software developer',
          avatar: 'avatar-url',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          socialLinks: {
            twitter: 'https://twitter.com/johndoe',
            github: 'https://github.com/johndoe'
          }
        }
      },
      code: `// JavaScript Example
const response = await fetch('https://your-domain.com/api/users/profile', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const user = await response.json();
console.log(user.username);`
    },
    'comments-list': {
      title: 'Comments - List Comments',
      method: 'GET',
      path: '/api/comments',
      description: 'Get list of comments with pagination',
      parameters: {
        query: {
          page: 'number (optional, default: 1)',
          limit: 'number (optional, default: 20)',
          postId: 'string (optional)',
          status: 'string (optional: pending, approved, rejected, spam)',
          sort: 'string (optional, default: -createdAt)'
        }
      },
      response: {
        success: {
          comments: [
            {
              _id: 'commentId',
              content: 'Great post!',
              author: {
                _id: 'authorId',
                username: 'jane_doe'
              },
              post: {
                _id: 'postId',
                title: 'Post Title'
              },
              status: 'approved',
              createdAt: '2024-01-15T10:00:00.000Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 50,
            pages: 3
          }
        }
      },
      code: `// JavaScript Example
const response = await fetch('https://your-domain.com/api/comments?postId=postId&status=approved');
const data = await response.json();
console.log(data.comments); // Array of comments`
    },
    'newsletter-subscribe': {
      title: 'Newsletter - Subscribe',
      method: 'POST',
      path: '/api/newsletter/subscribe',
      description: 'Subscribe to the newsletter',
      parameters: {
        body: {
          email: 'string (required)',
          name: 'string (required)'
        }
      },
      response: {
        success: {
          message: 'Successfully subscribed to newsletter',
          subscriber: {
            _id: 'subscriberId',
            email: 'subscriber@example.com',
            name: 'John Doe',
            isActive: true,
            createdAt: '2024-01-15T10:00:00.000Z'
          }
        },
        error: {
          message: 'Email already subscribed'
        }
      },
      code: `// JavaScript Example
const response = await fetch('https://your-domain.com/api/newsletter/subscribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'subscriber@example.com',
    name: 'John Doe'
  })
});`
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          API Documentation
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Complete reference for the Blog CMS REST API
        </p>
      </div>

      {/* API Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Globe className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
              Base URL
            </h3>
          </div>
          <code className="block p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
            https://your-domain.com/api
          </code>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Key className="h-8 w-8 text-green-600 dark:text-green-400" />
            <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
              Authentication
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bearer Token in Authorization header
          </p>
          <code className="block p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-800 dark:text-gray-200 mt-2">
            Authorization: Bearer YOUR_JWT_TOKEN
          </code>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Server className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
              Content Type
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            JSON for most requests, FormData for file uploads
          </p>
          <code className="block p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-800 dark:text-gray-200 mt-2">
            Content-Type: application/json
          </code>
        </div>
      </div>

      {/* Response Codes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Response Codes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Success Codes</h3>
            <ul className="space-y-1 text-sm">
              <li><code className="text-green-600 dark:text-green-400">200</code> - OK</li>
              <li><code className="text-green-600 dark:text-green-400">201</code> - Created</li>
              <li><code className="text-green-600 dark:text-green-400">204</code> - No Content</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Error Codes</h3>
            <ul className="space-y-1 text-sm">
              <li><code className="text-red-600 dark:text-red-400">400</code> - Bad Request</li>
              <li><code className="text-red-600 dark:text-red-400">401</code> - Unauthorized</li>
              <li><code className="text-red-600 dark:text-red-400">403</code> - Forbidden</li>
              <li><code className="text-red-600 dark:text-red-400">404</code> - Not Found</li>
              <li><code className="text-red-600 dark:text-red-400">500</code> - Internal Server Error</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Endpoint Navigation */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Endpoints
            </h3>
            <nav className="space-y-1">
              {Object.entries(endpoints).map(([key, endpoint]) => (
                <button
                  key={key}
                  onClick={() => setSelectedEndpoint(key)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors duration-200 ${
                    selectedEndpoint === key
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{endpoint.title}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      endpoint.method === 'GET' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400' :
                      endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400' :
                      endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400'
                    }`}>
                      {endpoint.method}
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {endpoints[selectedEndpoint] && (
              <div className="p-6">
                {/* Endpoint Header */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {endpoints[selectedEndpoint].title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {endpoints[selectedEndpoint].description}
                  </p>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      endpoints[selectedEndpoint].method === 'GET' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400' :
                      endpoints[selectedEndpoint].method === 'POST' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400' :
                      endpoints[selectedEndpoint].method === 'PUT' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400'
                    }`}>
                      {endpoints[selectedEndpoint].method}
                    </span>
                    <code className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                      {endpoints[selectedEndpoint].path}
                    </code>
                    {endpoints[selectedEndpoint].authentication && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-400 rounded text-sm">
                        Requires Auth
                      </span>
                    )}
                  </div>
                </div>

                {/* Parameters */}
                {endpoints[selectedEndpoint].parameters && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Parameters
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(endpoints[selectedEndpoint].parameters).map(([type, params]) => (
                        <div key={type}>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                            {type}
                          </h4>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            {Object.entries(params).map(([param, description]) => (
                              <div key={param} className="mb-2 last:mb-0">
                                <code className="text-sm font-mono text-blue-600 dark:text-blue-400">{param}</code>
                                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">- {description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Response */}
                {endpoints[selectedEndpoint].response && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Response
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(endpoints[selectedEndpoint].response).map(([type, response]) => (
                        <div key={type}>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                            {type} Response
                          </h4>
                          <pre className="bg-gray-900 text-gray-300 rounded-lg p-4 overflow-x-auto text-sm">
                            <code>{JSON.stringify(response, null, 2)}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Code Example */}
                {endpoints[selectedEndpoint].code && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Code Example
                      </h3>
                      <button
                        onClick={() => copyToClipboard(endpoints[selectedEndpoint].code)}
                        className="flex items-center px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
                      >
                        {copiedCode === endpoints[selectedEndpoint].code ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Clipboard className="h-4 w-4 mr-1" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="bg-gray-900 text-gray-300 rounded-lg p-4 overflow-x-auto text-sm">
                      <code>{endpoints[selectedEndpoint].code}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Resources */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Additional Resources
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SDKs & Libraries</h3>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• JavaScript/Node.js SDK</li>
              <li>• React Hooks</li>
              <li>• Postman Collection</li>
              <li>• OpenAPI Specification</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rate Limiting</h3>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• 100 requests per minute per IP</li>
              <li>• 1000 requests per hour per user</li>
              <li>• Authenticated users: 2000/hour</li>
              <li>• Headers: X-RateLimit-Limit, X-RateLimit-Remaining</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-4">
        <a
          href="https://github.com/yourusername/blog-cms"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
        >
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub Repository
        </a>
        <a
          href="https://postman.com/your-workspace"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
        >
          <ExternalLink className="h-5 w-5 mr-2" />
          Postman Collection
        </a>
        <a
          href="/api-docs/openapi.json"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
        >
          <FileText className="h-5 w-5 mr-2" />
          OpenAPI Spec
        </a>
      </div>
    </div>
  );
};

export default APIDocumentation;