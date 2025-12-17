// src/pages/Admin/SiteSettings/SiteSettings.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
   Settings,
   Image,
   Link,
   ShieldCheck,
   Mail,
   Globe,
   Cloud,
} from 'lucide-react';
import  settingsService  from '../../../services/settings';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';

const SiteSettings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Fetch current settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['site-settings'],
    queryFn: settingsService.getSettings
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: settingsService.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries(['site-settings']);
      setIsDirty(false);
      // Show success toast
    },
    onError: (error) => {
      // Show error toast
      console.error('Failed to update settings:', error);
    }
  });

  const handleInputChange = (section, key, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setIsDirty(true);
  };

  const handleSubmit = (section) => {
    updateMutation.mutate({
      section,
      data: formData[section] || settings?.[section] || {}
    });
  };

  const tabs = [
    { id: 'general', name: 'General', icon:  Settings },
    { id: 'appearance', name: 'Appearance', icon:  Image },
    { id: 'seo', name: 'SEO', icon:  Globe },
    { id: 'email', name: 'Email', icon:  Mail },
    { id: 'security', name: 'Security', icon:  ShieldCheck },
    { id: 'advanced', name: 'Advanced', icon:  Cloud }
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load settings" />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Site Settings</h1>
        <p className="text-gray-600">Configure your blog settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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

      {/* Settings Forms */}
      <div className="max-w-4xl">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Title
                </label>
                <input
                  type="text"
                  value={formData.general?.siteTitle || settings?.general?.siteTitle || ''}
                  onChange={(e) => handleInputChange('general', 'siteTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter site title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Description
                </label>
                <textarea
                  rows={3}
                  value={formData.general?.siteDescription || settings?.general?.siteDescription || ''}
                  onChange={(e) => handleInputChange('general', 'siteDescription', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter site description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site URL
                </label>
                <input
                  type="url"
                  value={formData.general?.siteUrl || settings?.general?.siteUrl || ''}
                  onChange={(e) => handleInputChange('general', 'siteUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={formData.general?.adminEmail || settings?.general?.adminEmail || ''}
                  onChange={(e) => handleInputChange('general', 'adminEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@example.com"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={formData.general?.maintenanceMode || settings?.general?.maintenanceMode || false}
                  onChange={(e) => handleInputChange('general', 'maintenanceMode', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900">
                  Enable maintenance mode
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSubmit('general')}
                  disabled={!isDirty || updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Appearance Settings */}
        {activeTab === 'appearance' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Appearance Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    < Image className="h-8 w-8 text-gray-400" />
                  </div>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Upload Logo
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Favicon
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                    < Link className="h-4 w-4 text-gray-400" />
                  </div>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Upload Favicon
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <input
                  type="color"
                  value={formData.appearance?.primaryColor || settings?.appearance?.primaryColor || '#3B82F6'}
                  onChange={(e) => handleInputChange('appearance', 'primaryColor', e.target.value)}
                  className="h-10 w-20 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <select
                  value={formData.appearance?.theme || settings?.appearance?.theme || 'light'}
                  onChange={(e) => handleInputChange('appearance', 'theme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSubmit('appearance')}
                  disabled={!isDirty || updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SEO Settings */}
        {activeTab === 'seo' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={formData.seo?.metaTitle || settings?.seo?.metaTitle || ''}
                  onChange={(e) => handleInputChange('seo', 'metaTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter meta title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  rows={3}
                  value={formData.seo?.metaDescription || settings?.seo?.metaDescription || ''}
                  onChange={(e) => handleInputChange('seo', 'metaDescription', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter meta description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Keywords
                </label>
                <input
                  type="text"
                  value={formData.seo?.metaKeywords || settings?.seo?.metaKeywords || ''}
                  onChange={(e) => handleInputChange('seo', 'metaKeywords', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Analytics ID
                </label>
                <input
                  type="text"
                  value={formData.seo?.googleAnalyticsId || settings?.seo?.googleAnalyticsId || ''}
                  onChange={(e) => handleInputChange('seo', 'googleAnalyticsId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="UA-XXXXXXXXX-X"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableIndexing"
                  checked={formData.seo?.enableIndexing || settings?.seo?.enableIndexing !== false}
                  onChange={(e) => handleInputChange('seo', 'enableIndexing', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableIndexing" className="ml-2 block text-sm text-gray-900">
                  Allow search engines to index this site
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSubmit('seo')}
                  disabled={!isDirty || updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Email Settings */}
        {activeTab === 'email' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={formData.email?.smtpHost || settings?.email?.smtpHost || ''}
                  onChange={(e) => handleInputChange('email', 'smtpHost', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={formData.email?.smtpPort || settings?.email?.smtpPort || 587}
                  onChange={(e) => handleInputChange('email', 'smtpPort', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="587"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Username
                </label>
                <input
                  type="text"
                  value={formData.email?.smtpUsername || settings?.email?.smtpUsername || ''}
                  onChange={(e) => handleInputChange('email', 'smtpUsername', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your-email@gmail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Password
                </label>
                <input
                  type="password"
                  value={formData.email?.smtpPassword || ''}
                  onChange={(e) => handleInputChange('email', 'smtpPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter SMTP password"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableEmailVerification"
                  checked={formData.email?.enableVerification || settings?.email?.enableVerification !== false}
                  onChange={(e) => handleInputChange('email', 'enableVerification', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableEmailVerification" className="ml-2 block text-sm text-gray-900">
                  Enable email verification for new users
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSubmit('email')}
                  disabled={!isDirty || updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h2>
            
            <div className="space-y-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableTwoFactor"
                  checked={formData.security?.enableTwoFactor || settings?.security?.enableTwoFactor || false}
                  onChange={(e) => handleInputChange('security', 'enableTwoFactor', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableTwoFactor" className="ml-2 block text-sm text-gray-900">
                  Enable two-factor authentication
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={formData.security?.sessionTimeout || settings?.security?.sessionTimeout || 30}
                  onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="5"
                  max="1440"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableBruteForceProtection"
                  checked={formData.security?.enableBruteForceProtection || settings?.security?.enableBruteForceProtection !== false}
                  onChange={(e) => handleInputChange('security', 'enableBruteForceProtection', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableBruteForceProtection" className="ml-2 block text-sm text-gray-900">
                  Enable brute force protection
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSubmit('security')}
                  disabled={!isDirty || updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        {activeTab === 'advanced' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Advanced Settings</h2>
            
            <div className="space-y-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableCache"
                  checked={formData.advanced?.enableCache || settings?.advanced?.enableCache !== false}
                  onChange={(e) => handleInputChange('advanced', 'enableCache', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableCache" className="ml-2 block text-sm text-gray-900">
                  Enable caching
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cache Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.advanced?.cacheDuration || settings?.advanced?.cacheDuration || 60}
                  onChange={(e) => handleInputChange('advanced', 'cacheDuration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="10080"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableCDN"
                  checked={formData.advanced?.enableCDN || settings?.advanced?.enableCDN || false}
                  onChange={(e) => handleInputChange('advanced', 'enableCDN', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableCDN" className="ml-2 block text-sm text-gray-900">
                  Enable CDN
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSubmit('advanced')}
                  disabled={!isDirty || updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteSettings;