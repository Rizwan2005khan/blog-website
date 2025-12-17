import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText,
  Key,
  ExternalLink,
  Clipboard,
  Check
} from 'lucide-react';
import  apiService  from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';

const APIDocumentation = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Fetch API documentation
  const { data: apiDocs, isLoading, error } = useQuery({
    queryKey: ['api-documentation'],
    queryFn: apiService.getDocumentation
  });

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/api/posts',
      name: 'Get Posts',
      description: 'Retrieve a list of blog posts with pagination and filtering',
      category: 'Posts'
    },
    {
      method: 'POST',
      path: '/api/posts',
      name: 'Create Post',
      description: 'Create a new blog post',
      category: 'Posts'
    },
    {
      method: 'GET',
      path: '/api/posts/:id',
      name: 'Get Post by ID',
      description: 'Retrieve a specific blog post by ID',
      category: 'Posts'
    },
    {
      method: 'PUT',
      path: '/api/posts/:id',
      name: 'Update Post',
      description: 'Update an existing blog post',
      category: 'Posts'
    },
    {
      method: 'DELETE',
      path: '/api/posts/:id',
      name: 'Delete Post',
      description: 'Delete a blog post',
      category: 'Posts'
    },
    {
      method: 'GET',
      path: '/api/categories',
      name: 'Get Categories',
      description: 'Retrieve a list of categories',
      category: 'Categories'
    },
    {
      method: 'POST',
      path: '/api/auth/login',
      name: 'User Login',
      description: 'Authenticate user and get access token',
      category: 'Authentication'
    },
    {
      method: 'POST',
      path: '/api/auth/register',
      name: 'User Registration',
      description: 'Register a new user account',
      category: 'Authentication'
    }
  ];

  const categories = [...new Set(endpoints.map(ep => ep.category))];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load API documentation" />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API Documentation</h1>
        <p className="text-gray-600">Complete reference for the Blog CMS API</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Endpoints</h2>
            
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{category}</h3>
                  <div className="space-y-1 ml-3">
                    {endpoints
                      .filter(ep => ep.category === category)
                      .map((endpoint) => (
                        <button
                          key={endpoint.path}
                          onClick={() => setSelectedEndpoint(endpoint)}
                          className={`w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                            selectedEndpoint?.path === endpoint.path
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          {endpoint.name}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedEndpoint ? (
            <div className="space-y-6">
              {/* Endpoint Header */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedEndpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                      selectedEndpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                      selectedEndpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                      selectedEndpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedEndpoint.method}
                    </span>
                    <code className="text-sm font-mono text-gray-900">
                      {selectedEndpoint.path}
                    </code>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <ExternalLink className="h-5 w-5" />
                  </button>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedEndpoint.name}
                </h3>
                <p className="text-gray-600">{selectedEndpoint.description}</p>
              </div>

              {/* Request Example */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Request Example</h3>
                  <button
                    onClick={() => copyToClipboard(
                      `curl -X ${selectedEndpoint.method} https://api.example.com${selectedEndpoint.path} \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json"`,
                      'request'
                    )}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  >
                    {copiedCode === 'request' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Clipboard className="h-4 w-4" />
                    )}
                    Copy
                  </button>
                </div>
                
                <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-gray-800">
{`curl -X ${selectedEndpoint.method} https://api.example.com${selectedEndpoint.path} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                  </code>
                </pre>
              </div>

              {/* Response Example */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Response Example</h3>
                  <button
                    onClick={() => copyToClipboard(
                      JSON.stringify({
                        success: true,
                        data: {
                          id: 1,
                          title: "Sample Post",
                          content: "This is a sample post content",
                          createdAt: "2024-01-01T00:00:00Z"
                        },
                        meta: {
                          total: 100,
                          page: 1,
                          limit: 10
                        }
                      }, null, 2),
                      'response'
                    )}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  >
                    {copiedCode === 'response' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Clipboard className="h-4 w-4" />
                    )}
                    Copy
                  </button>
                </div>
                
                <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-gray-800">
{`{
  "success": true,
  "data": {
    "id": 1,
    "title": "Sample Post",
    "content": "This is a sample post content",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10
  }
}`}
                  </code>
                </pre>
              </div>

              {/* Parameters */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Parameters</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Headers</h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm">
                        <span className="text-gray-600">Authorization:</span>
                        <span className="text-gray-900 ml-2">Bearer YOUR_API_KEY</span>
                      </div>
                      <div className="text-sm mt-1">
                        <span className="text-gray-600">Content-Type:</span>
                        <span className="text-gray-900 ml-2">application/json</span>
                      </div>
                    </div>
                  </div>

                  {selectedEndpoint.method !== 'GET' && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Body (JSON)</h4>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <pre className="text-sm text-gray-800">
{`{
  "title": "string",
  "content": "string",
  "category": "string",
  "tags": ["string"]
}`}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Responses */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Responses</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">400 - Bad Request</h4>
                    <pre className="bg-red-50 rounded-lg p-3 text-sm text-red-800">
{`{
  "success": false,
  "error": "Invalid request data",
  "details": {
    "field": "title",
    "message": "Title is required"
  }
}`}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">401 - Unauthorized</h4>
                    <pre className="bg-red-50 rounded-lg p-3 text-sm text-red-800">
{`{
  "success": false,
  "error": "Invalid or missing API key"
}`}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">404 - Not Found</h4>
                    <pre className="bg-red-50 rounded-lg p-3 text-sm text-red-800">
{`{
  "success": false,
  "error": "Resource not found"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Endpoint</h3>
              <p className="text-gray-600">
                Choose an endpoint from the sidebar to view detailed documentation
              </p>
            </div>
          )}

          {/* API Key Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <Key className="h-6 w-6 text-blue-600 mt-1" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-900">
                  API Authentication
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p className="mb-2">
                    All API requests require an API key for authentication. Include your API key in the Authorization header:
                  </p>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">
                    Authorization: Bearer YOUR_API_KEY
                  </code>
                  <p className="mt-2">
                    You can generate and manage your API keys in the API Settings section.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIDocumentation;