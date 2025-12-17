// src/pages/Admin/AdminDashboard/AdminDashboard.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  Tag, 
  MessageCircle,
  Mail,
  BarChart3,
  Settings,
  CloudUpload,
  AlertTriangle 
} from 'lucide-react';
import  dashboardService  from '../../../services/dashboard';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';

const AdminDashboard = () => {
  // Fetch dashboard stats
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getDashboardStats
  });

  // Fetch recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: dashboardService.getRecentActivity
  });

  const dashboardCards = [
    {
      title: 'Total Posts',
      value: stats?.posts || 0,
      icon: FileText,
      color: 'bg-blue-500',
      link: '/admin/posts',
      change: stats?.postsChange || 0
    },
    {
      title: 'Total Users',
      value: stats?.users || 0,
      icon: Users,
      color: 'bg-green-500',
      link: '/admin/users',
      change: stats?.usersChange || 0
    },
    {
      title: 'Categories',
      value: stats?.categories || 0,
      icon: Tag,
      color: 'bg-purple-500',
      link: '/admin/categories',
      change: stats?.categoriesChange || 0
    },
    {
      title: 'Comments',
      value: stats?.comments || 0,
      icon: MessageCircle,
      color: 'bg-orange-500',
      link: '/admin/comments',
      change: stats?.commentsChange || 0
    },
    {
      title: 'Subscribers',
      value: stats?.subscribers || 0,
      icon: Mail,
      color: 'bg-red-500',
      link: '/admin/newsletter',
      change: stats?.subscribersChange || 0
    },
    {
      title: 'Page Views',
      value: stats?.pageViews || 0,
      icon: BarChart3,
      color: 'bg-indigo-500',
      link: '/admin/analytics',
      change: stats?.pageViewsChange || 0
    }
  ];

  const quickActions = [
    { title: 'Write Post', icon: FileText, link: '/admin/posts/create', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
    { title: 'Manage Users', icon: Users, link: '/admin/users', color: 'text-green-600 bg-green-50 hover:bg-green-100' },
    { title: 'Site Settings', icon: Settings, link: '/admin/settings', color: 'text-gray-600 bg-gray-50 hover:bg-gray-100' },
    { title: 'Backup Site', icon: CloudUpload, link: '/admin/backup', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' }
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load dashboard data" />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your blog.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {dashboardCards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
                {card.change !== 0 && (
                  <p className={`text-xs ${card.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {card.change > 0 ? '+' : ''}{card.change}%
                  </p>
                )}
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  to={action.link}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${action.color}`}
                >
                  <action.icon className="h-5 w-5" />
                  <span className="font-medium">{action.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity?.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="p-2 rounded-full bg-gray-100">
                    {activity.type === 'post' && <FileText className="h-4 w-4" />}
                    {activity.type === 'user' && <Users className="h-4 w-4" />}
                    {activity.type === 'comment' && <MessageCircle className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {(!recentActivity || recentActivity.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle  className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity to display</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;