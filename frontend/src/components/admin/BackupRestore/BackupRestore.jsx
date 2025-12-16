import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  ClockIcon,
  DocumentTextIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const BackupRestore = () => {
  const [backupType, setBackupType] = useState('full');
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Fetch backup history
  const { data: backups = [], isLoading: backupsLoading, refetch: refetchBackups } = useQuery({
    queryKey: ['backups', 'admin'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/backups`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch backups');
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async (type) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/backups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ type })
      });
      if (!response.ok) throw new Error('Failed to create backup');
      return response.json();
    },
    onSuccess: () => {
      refetchBackups();
      toast.success('Backup created successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create backup');
    },
  });

  // Download backup mutation
  const downloadBackupMutation = useMutation({
    mutationFn: async (backupId) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/backups/${backupId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to download backup');
      
      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `backup-${backupId}.json`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Backup downloaded successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to download backup');
    },
  });

  // Restore backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: async ({ backupId, options }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/backups/${backupId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(options)
      });
      if (!response.ok) throw new Error('Failed to restore backup');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Backup restored successfully!');
      setIsRestoring(false);
      setSelectedBackup(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to restore backup');
      setIsRestoring(false);
    },
  });

  // Delete backup mutation
  const deleteBackupMutation = useMutation({
    mutationFn: async (backupId) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/backups/${backupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete backup');
      return response.json();
    },
    onSuccess: () => {
      refetchBackups();
      toast.success('Backup deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete backup');
    },
  });

  const handleCreateBackup = () => {
    createBackupMutation.mutate(backupType);
  };

  const handleDownloadBackup = (backupId) => {
    downloadBackupMutation.mutate(backupId);
  };

  const handleRestoreBackup = (backupId) => {
    setSelectedBackup(backupId);
    setIsRestoring(true);
  };

  const confirmRestore = (options) => {
    restoreBackupMutation.mutate({ backupId: selectedBackup, options });
  };

  const handleDeleteBackup = (backupId) => {
    if (window.confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      deleteBackupMutation.mutate(backupId);
    }
  };

  const getBackupTypeIcon = (type) => {
    const icons = {
      full: CloudArrowDownIcon,
      database: DocumentTextIcon,
      media: PhotoIcon,
      settings: CogIcon
    };
    return icons[type] || CloudArrowDownIcon;
  };

  const getBackupTypeColor = (type) => {
    const colors = {
      full: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
      database: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
      media: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
      settings: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400'
    };
    return colors[type] || colors.full;
  };

  if (backupsLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Backup & Restore
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create backups and restore your website data
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <ClockIcon className="h-4 w-4" />
          <span>Last backup: {analytics.lastBackup ? new Date(analytics.lastBackup).toLocaleString() : 'Never'}</span>
        </div>
      </div>

      {/* Create Backup Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Create New Backup
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Backup Type
            </label>
            <select
              value={backupType}
              onChange={(e) => setBackupType(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="full">Full Backup (All Data)</option>
              <option value="database">Database Only</option>
              <option value="media">Media Files Only</option>
              <option value="settings">Settings Only</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Choose what data to include in the backup
            </p>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleCreateBackup}
              disabled={createBackupMutation.isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <CloudArrowDownIcon className="h-5 w-5 mr-2" />
              {createBackupMutation.isLoading ? 'Creating...' : 'Create Backup'}
            </button>
          </div>
        </div>

        {/* Backup Info */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Backup Information
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>Backups are stored securely on the server</li>
                  <li>Full backups include: posts, users, comments, settings, and media files</li>
                  <li>Database backups include: all database records (excluding media files)</li>
                  <li>Media backups include: uploaded images and files</li>
                  <li>Settings backups include: site configuration and preferences</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Backups */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Existing Backups
          </h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {backups.length === 0 ? (
            <div className="text-center py-12">
              <CloudArrowDownIcon className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No backups found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create your first backup to get started
              </p>
            </div>
          ) : (
            backups.map((backup) => {
              const IconComponent = getBackupTypeIcon(backup.type);
              return (
                <div key={backup._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full ${getBackupTypeColor(backup.type)}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {backup.name || `${backup.type} Backup`}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Created {new Date(backup.createdAt).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Size: {(backup.size / 1024 / 1024).toFixed(2)} MB • 
                          {backup.includes.posts && ' Posts,'}
                          {backup.includes.users && ' Users,'}
                          {backup.includes.comments && ' Comments,'}
                          {backup.includes.settings && ' Settings,'}
                          {backup.includes.media && ' Media'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownloadBackup(backup._id)}
                        disabled={downloadBackupMutation.isLoading}
                        className="flex items-center px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors duration-200"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        Download
                      </button>
                      <button
                        onClick={() => handleRestoreBackup(backup._id)}
                        disabled={isRestoring}
                        className="flex items-center px-3 py-1 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors duration-200"
                      >
                        <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                        Restore
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(backup._id)}
                        className="flex items-center px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-200"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {isRestoring && selectedBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Restore Backup
              </h3>
              <button
                onClick={() => {
                  setIsRestoring(false);
                  setSelectedBackup(null);
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      Warning
                    </h4>
                    <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                      Restoring a backup will overwrite your current data. Make sure you have a recent backup before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Restore Options
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Posts and Content
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Users and Comments
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Settings and Configuration
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Media Files
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsRestoring(false);
                    setSelectedBackup(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmRestore({
                    posts: true,
                    users: true,
                    comments: true,
                    settings: true,
                    media: false
                  })}
                  disabled={restoreBackupMutation.isLoading}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                  {restoreBackupMutation.isLoading ? 'Restoring...' : 'Restore Backup'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default BackupRestore;