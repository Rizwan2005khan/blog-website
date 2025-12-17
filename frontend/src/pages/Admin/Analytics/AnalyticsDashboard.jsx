// src/pages/Admin/Analytics/AnalyticsDashboard.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3,
  UserIcon,
  Eye,
  FileText,
  TrendingUp,
  TrendingDown 
} from 'lucide-react';
import  analyticsService  from '../../../services/analytics';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState('7d');
  const [metricType, setMetricType] = useState('traffic');

  // Fetch analytics data
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics', dateRange, metricType],
    queryFn: () => analyticsService.getAnalytics({
      dateRange,
      metric: metricType
    })
  });

  const statsCards = [
    {
      title: 'Total Page Views',
      value: analytics?.traffic?.totalPageViews || 0,
      change: analytics?.traffic?.pageViewsChange || 0,
      icon: Eye,
      color: 'bg-blue-500'
    },
    {
      title: 'Unique Visitors',
      value: analytics?.traffic?.uniqueVisitors || 0,
      change: analytics?.traffic?.visitorsChange || 0,
      icon: UserIcon,
      color: 'bg-green-500'
    },
    {
      title: 'Avg. Session Duration',
      value: analytics?.traffic?.avgSessionDuration || '0m',
      change: analytics?.traffic?.sessionDurationChange || 0,
      icon: ClockIcon,
      color: 'bg-purple-500'
    },
    {
      title: 'Bounce Rate',
      value: `${analytics?.traffic?.bounceRate || 0}%`,
      change: analytics?.traffic?.bounceRateChange || 0,
      icon: BarChart3,
      color: 'bg-orange-500'
    }
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load analytics" />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Monitor your blog performance and user engagement</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            <select
              value={metricType}
              onChange={(e) => setMetricType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="traffic">Traffic</option>
              <option value="content">Content</option>
              <option value="users">Users</option>
              <option value="engagement">Engagement</option>
            </select>
          </div>
          
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card) => (
          <div key={card.title} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
                {card.change !== 0 && (
                  <div className={`flex items-center text-sm ${card.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {card.change > 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown  className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(card.change)}%
                  </div>
                )}
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Traffic Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Overview</h3>
          <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
            <BarChart3 className="h-12 w-12 mr-2" />
            Traffic Chart Placeholder
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h3>
          <div className="space-y-3">
            {analytics?.topPages?.map((page, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 w-6">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {page.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {page.url}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {page.views.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Popular Posts */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Posts</h3>
          <div className="space-y-3">
            {analytics?.popularPosts?.map((post, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {post.views.toLocaleString()} views
                  </p>
                </div>
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
          <div className="space-y-3">
            {analytics?.trafficSources?.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-700">{source.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {source.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* User Demographics */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Demographics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Desktop</span>
              <span className="text-sm font-medium text-gray-900">
                {analytics?.deviceStats?.desktop || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Mobile</span>
              <span className="text-sm font-medium text-gray-900">
                {analytics?.deviceStats?.mobile || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tablet</span>
              <span className="text-sm font-medium text-gray-900">
                {analytics?.deviceStats?.tablet || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;