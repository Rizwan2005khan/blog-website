// src/pages/Admin/BackupRestore/BackupRestore.jsx
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  CloudUpload,
  CloudDownload,
  Clock,
  FileText,
  Image,
  User,
  Settings,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import  backupService  from '../../../services/backup';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';

const BackupRestore = () => {
  const [backupType, setBackupType] = useState('full');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isRestoring, setIsRestoring] = useState(false);

  // Fetch backup history
  const { data: backups, isLoading, error } = useQuery({
    queryKey: ['backup-history'],
    queryFn: backupService.getBackupHistory
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: backupService.createBackup,
    onSuccess: () => {
      // Show success toast
      // Refetch backups
    },
    onError: (error) => {
      // Show error toast
      console.error('Failed to create backup:', error);
    }
  });

  // Restore backup mutation
  const restoreMutation = useMutation({
    mutationFn: backupService.restoreBackup,
    onSuccess: () => {
      setIsRestoring(false);
      // Show success toast
    },
    onError: (error) => {
      setIsRestoring(false);
      // Show error toast
      console.error('Failed to restore backup:', error);
    }
  });

  const handleCreateBackup = () => {
    const backupData = {
      type: backupType,
      includeFiles: selectedFiles
    };
    createBackupMutation.mutate(backupData);
  };

  const handleRestoreBackup = (backupId) => {
    if (window.confirm('Are you sure you want to restore this backup? This will overwrite current data.')) {
      setIsRestoring(true);
      restoreMutation.mutate(backupId);
    }
  };

  const handleDeleteBackup = (backupId) => {
    if (window.confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      // Implement delete backup
      console.log('Delete backup:', backupId);
    }
  };

  const backupOptions = [
    { id: 'full', name: 'Full Backup', description: 'Complete backup of all data and files' },
    { id: 'database', name: 'Database Only', description: 'Backup of all database content' },
    { id: 'media', name: 'Media Files', description: 'Backup of images and media files' },
    { id: 'custom', name: 'Custom Selection', description: 'Select specific components to backup' }
  ];

  const fileOptions = [
    { id: 'posts', name: 'Posts', icon: FileText },
    { id: 'media', name: 'Media Files', icon: Image },
    { id: 'users', name: 'User Data', icon: User },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load backup data" />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Backup & Restore</h1>
        <p className="text-gray-600">Create backups and restore your site data</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{backups?.length || 0}</p>
              <p className="text-sm text-gray-600">Total Backups</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <CloudUpload className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {backups?.filter(b => b.status === 'completed').length || 0}
              </p>
              <p className="text-sm text-gray-600">Successful Backups</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {backups?.reduce((total, backup) => total + (backup.size || 0), 0).toFixed(2)} MB
              </p>
              <p className="text-sm text-gray-600">Total Storage Used</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Backup */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Backup</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Type
              </label>
              <div className="space-y-2">
                {backupOptions.map((option) => (
                  <label key={option.id} className="flex items-center">
                    <input
                      type="radio"
                      name="backupType"
                      value={option.id}
                      checked={backupType === option.id}
                      onChange={(e) => setBackupType(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{option.name}</p>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {backupType === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Components
                </label>
                <div className="space-y-2">
                  {fileOptions.map((option) => (
                    <label key={option.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(option.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFiles([...selectedFiles, option.id]);
                          } else {
                            setSelectedFiles(selectedFiles.filter(id => id !== option.id));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex items-center">
                        <option.icon className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-700">{option.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleCreateBackup}
              disabled={createBackupMutation.isPending}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CloudUpload className="h-5 w-5 mr-2" />
              {createBackupMutation.isPending ? 'Creating Backup...' : 'Create Backup'}
            </button>
          </div>
        </div>

        {/* Backup History */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Backup History</h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {backups?.map((backup) => (
              <div key={backup._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    backup.status === 'completed' ? 'bg-green-100' : 
                    backup.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    {backup.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : backup.status === 'failed' ? (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {backup.type} Backup
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(backup.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {(backup.size || 0).toFixed(1)} MB
                  </span>
                  
                  {backup.status === 'completed' && (
                    <button
                      onClick={() => handleRestoreBackup(backup._id)}
                      disabled={isRestoring}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Restore Backup"
                    >
                      <CloudDownload className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteBackup(backup._id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Backup"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {(!backups || backups.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <CloudUpload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No backups created yet</p>
                <p className="text-sm">Create your first backup to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warning Message */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Important Backup Information
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Regular backups are essential for data protection</li>
                <li>Store backups in multiple locations for redundancy</li>
                <li>Test restore procedures periodically</li>
                <li>Monitor backup storage usage and cleanup old backups</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;