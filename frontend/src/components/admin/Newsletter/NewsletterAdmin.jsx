import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Mail,
  Send,
  Users,
  BarChart3,
  Plus,
  Eye,
  Trash2,
  Edit
} from 'lucide-react';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import NewsletterForm from '../../../components/admin/NewsletterForm';

const NewsletterAdmin = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('subscribers');
  const [showForm, setShowForm] = useState(false);
  const [editingNewsletter, setEditingNewsletter] = useState(null);
  const [selectedSubscribers, setSelectedSubscribers] = useState([]);

  // Fetch subscribers
  const { data: subscribers = [], isLoading: subscribersLoading } = useQuery({
    queryKey: ['subscribers', 'admin'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/newsletter/subscribers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch subscribers');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch newsletters
  const { data: newsletters = [], isLoading: newslettersLoading } = useQuery({
    queryKey: ['newsletters', 'admin'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/newsletter`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch newsletters');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch analytics
  const { data: analytics = {} } = useQuery({
    queryKey: ['newsletter', 'analytics'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/newsletter/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  // Send newsletter mutation
  const sendNewsletterMutation = useMutation({
    mutationFn: async (newsletterId) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/newsletter/${newsletterId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to send newsletter');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['newsletters', 'admin']);
      toast.success('Newsletter sent successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send newsletter');
    },
  });

  // Delete newsletter mutation
  const deleteNewsletterMutation = useMutation({
    mutationFn: async (newsletterId) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/newsletter/${newsletterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete newsletter');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['newsletters', 'admin']);
      toast.success('Newsletter deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete newsletter');
    },
  });

  // Toggle subscriber status mutation
  const toggleSubscriberMutation = useMutation({
    mutationFn: async (subscriberId) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/newsletter/subscribers/${subscriberId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to toggle subscriber status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['subscribers', 'admin']);
      toast.success('Subscriber status updated successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to toggle subscriber status');
    },
  });

  const handleSendNewsletter = (newsletterId) => {
    if (window.confirm('Are you sure you want to send this newsletter to all subscribers?')) {
      sendNewsletterMutation.mutate(newsletterId);
    }
  };

  const handleDeleteNewsletter = (newsletterId) => {
    if (window.confirm('Are you sure you want to delete this newsletter?')) {
      deleteNewsletterMutation.mutate(newsletterId);
    }
  };

  const handleCreateNewsletter = () => {
    setEditingNewsletter(null);
    setShowForm(true);
  };

  const handleEditNewsletter = (newsletter) => {
    setEditingNewsletter(newsletter);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingNewsletter(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400',
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400',
      sent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400'
    };
    return badges[status] || badges.draft;
  };

  const tabs = [
    { id: 'subscribers', name: 'Subscribers', icon: Users },
    { id: 'newsletters', name: 'Newsletters', icon: Mail },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'subscribers':
        return (
          <div className="space-y-6">
            {/* Subscribers Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalSubscribers || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Subscribers</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.activeSubscribers || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analytics.newSubscribersThisMonth || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">This Month</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{analytics.unsubscribedThisMonth || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Unsubscribed</div>
              </div>
            </div>

            {/* Subscribers List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Subscriber List
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {subscribersLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : subscribers.length === 0 ? (
                  <div className="text-center py-12">
                    <UserGroupIcon className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No subscribers yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      People will appear here when they subscribe to your newsletter
                    </p>
                  </div>
                ) : (
                  subscribers.map((subscriber) => (
                    <div key={subscriber._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                            {subscriber.avatar ? (
                              <img
                                src={subscriber.avatar}
                                alt={subscriber.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {subscriber.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {subscriber.email}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Subscribed {new Date(subscriber.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleSubscriberMutation.mutate(subscriber._id)}
                            className={`px-3 py-1 text-xs rounded ${
                              subscriber.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400'
                            }`}
                          >
                            {subscriber.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'newsletters':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Newsletter Campaigns
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create and manage your email campaigns
                </p>
              </div>
              <button
                onClick={handleCreateNewsletter}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Newsletter
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newslettersLoading ? (
                <div className="col-span-full flex justify-center py-8">
                  <LoadingSpinner size="large" />
                </div>
              ) : newsletters.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <EnvelopeIcon className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No newsletters yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Create your first newsletter to get started
                  </p>
                </div>
              ) : (
                newsletters.map((newsletter) => (
                  <div key={newsletter._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {newsletter.subject}
                          </h4>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${getStatusBadge(newsletter.status)}`}>
                            {newsletter.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditNewsletter(newsletter)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNewsletter(newsletter._id)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                        {newsletter.content}
                      </p>

                      <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center justify-between">
                          <span>Recipients:</span>
                          <span>{newsletter.recipientsCount || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Open Rate:</span>
                          <span>{newsletter.openRate || 0}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Click Rate:</span>
                          <span>{newsletter.clickRate || 0}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Created:</span>
                          <span>{new Date(newsletter.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-2">
                          {newsletter.status === 'draft' && (
                            <button
                              onClick={() => handleSendNewsletter(newsletter._id)}
                              className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors duration-200"
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Send
                            </button>
                          )}
                          <button
                            onClick={() => {/* Preview logic */}}
                            className="flex items-center px-3 py-1 text-blue-600 dark:text-blue-400 text-sm hover:underline"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {newsletter.status === 'sent' && (
                            <>Sent {new Date(newsletter.sentAt).toLocaleDateString()}</>
                          )}
                          {newsletter.status === 'scheduled' && newsletter.scheduledFor && (
                            <>Scheduled for {new Date(newsletter.scheduledFor).toLocaleDateString()}</>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalSubscribers || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Subscribers</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{analytics.averageOpenRate || 0}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Open Rate</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{analytics.averageClickRate || 0}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Click Rate</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{analytics.totalSent || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Sent</div>
              </div>
            </div>

            {/* Recent Performance */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Newsletter Performance
                </h3>
              </div>
              <div className="p-6">
                {newsletters.slice(0, 5).map((newsletter, index) => (
                  <div key={newsletter._id} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 w-16">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {newsletter.subject}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(newsletter.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-gray-900 dark:text-white">{newsletter.recipientsCount || 0}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Sent</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600 dark:text-green-400">{newsletter.openRate || 0}%</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Opened</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-blue-600 dark:text-blue-400">{newsletter.clickRate || 0}%</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Clicked</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (showForm) {
    return (
      <NewsletterForm
        newsletter={editingNewsletter}
        onClose={handleFormClose}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Newsletter Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage email campaigns and subscribers
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default NewsletterAdmin;