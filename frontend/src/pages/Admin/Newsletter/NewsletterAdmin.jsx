// src/pages/Admin/Newsletter/NewsletterAdmin.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
   Send,
   Plus,
   Edit,
   Trash2,
   Eye,
   Mail,
   Users,
   BarChart3,
   CheckCircle,
} from 'lucide-react';
import  newsletterService  from '../../../services/newsletter';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';

const NewsletterAdmin = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('subscribers');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch subscribers
  const { data: subscribers, isLoading: subscribersLoading } = useQuery({
    queryKey: ['newsletter-subscribers', searchTerm, currentPage],
    queryFn: () => newsletterService.getSubscribers({
      search: searchTerm,
      page: currentPage,
      limit: itemsPerPage
    }),
    enabled: activeTab === 'subscribers'
  });

  // Fetch campaigns
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['newsletter-campaigns', currentPage],
    queryFn: () => newsletterService.getCampaigns({
      page: currentPage,
      limit: itemsPerPage
    }),
    enabled: activeTab === 'campaigns'
  });

  // Fetch newsletter stats
  const { data: stats } = useQuery({
    queryKey: ['newsletter-stats'],
    queryFn: newsletterService.getStats
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: newsletterService.createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries(['newsletter-campaigns']);
      // Show success toast
    }
  });

  // Send campaign mutation
  const sendCampaignMutation = useMutation({
    mutationFn: newsletterService.sendCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries(['newsletter-campaigns']);
      // Show success toast
    }
  });

  const handleCreateCampaign = () => {
    // Open campaign creation modal
    console.log('Create campaign');
  };

  const handleSendCampaign = (campaignId) => {
    if (window.confirm('Are you sure you want to send this campaign to all subscribers?')) {
      sendCampaignMutation.mutate(campaignId);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const tabs = [
    { id: 'subscribers', name: 'Subscribers', icon:  Users },
    { id: 'campaigns', name: 'Campaigns', icon:  Send },
    { id: 'analytics', name: 'Analytics', icon:  BarChart3 }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Newsletter Management</h1>
        <p className="text-gray-600">Manage your email subscribers and campaigns</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[
          { title: 'Total Subscribers', value: stats?.totalSubscribers || 0, icon:  Users, color: 'bg-blue-500' },
          { title: 'Active Subscribers', value: stats?.activeSubscribers || 0, icon:  CheckCircle, color: 'bg-green-500' },
          { title: 'Total Campaigns', value: stats?.totalCampaigns || 0, icon:  Send, color: 'bg-purple-500' },
          { title: 'Avg. Open Rate', value: `${stats?.avgOpenRate || 0}%`, icon:  BarChart3, color: 'bg-orange-500' }
        ].map((stat) => (
          <div key={stat.title} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.title}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className={`h-5 w-5 mr-2 ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Subscribers Tab */}
      {activeTab === 'subscribers' && (
        <div>
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscriber
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscribed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engagement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscribers?.data?.map((subscriber) => (
                    <tr key={subscriber._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          < Mail className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {subscriber.email}
                            </div>
                            {subscriber.name && (
                              <div className="text-sm text-gray-500">{subscriber.name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          subscriber.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {subscriber.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(subscriber.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span>{subscriber.openRate || 0}% open rate</span>
                          <span>{subscriber.clickRate || 0}% click rate</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-red-600 hover:text-red-900">
                          < Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <button
              onClick={handleCreateCampaign}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              < Plus className="h-5 w-5 mr-2" />
              Create Campaign
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns?.data?.map((campaign) => (
                    <tr key={campaign._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {campaign.subject}
                          </div>
                          <div className="text-sm text-gray-500">
                            {campaign.preview}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {campaign.recipients?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span>{campaign.openRate || 0}% opens</span>
                          <span>{campaign.clickRate || 0}% clicks</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            < Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            < Edit className="h-4 w-4" />
                          </button>
                          {campaign.status === 'draft' && (
                            <button
                              onClick={() => handleSendCampaign(campaign._id)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              < Send className="h-4 w-4" />
                            </button>
                          )}
                          <button className="text-red-600 hover:text-red-900">
                            < Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Growth</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              Chart will be implemented here
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              Chart will be implemented here
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsletterAdmin;