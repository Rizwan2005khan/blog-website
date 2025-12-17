import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  CloudDownload,
  CloudUpload,
  Clock,
  FileText,
  Trash2,
  Download,
  AlertTriangle,
  Image,
  Settings
} from 'lucide-react';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const BackupRestore = () => {
  const [backupType, setBackupType] = useState('full');
  const [selectedBackup, setSelectedBackup] = useState(null);

  const [restoreOptions, setRestoreOptions] = useState({
    posts: true,
    users: true,
    comments: true,
    settings: true,
    media: false,
  });

  /* -------------------- Fetch Backups -------------------- */
  const {
    data: backups = [],
    isLoading: backupsLoading,
    refetch: refetchBackups,
  } = useQuery({
    queryKey: ['backups', 'admin'],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/backups`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (!res.ok) throw new Error('Failed to fetch backups');
      return res.json();
    },
    staleTime: 30_000,
  });

  const lastBackupDate = useMemo(() => {
    if (!backups.length) return null;
    return new Date(
      Math.max(...backups.map(b => new Date(b.createdAt)))
    );
  }, [backups]);

  /* -------------------- Create Backup -------------------- */
  const createBackupMutation = useMutation({
    mutationFn: async (type) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/backups`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ type }),
        }
      );
      if (!res.ok) throw new Error('Failed to create backup');
      return res.json();
    },
    onSuccess: () => {
      refetchBackups();
      toast.success('Backup created successfully');
    },
    onError: (e) => toast.error(e.message),
  });

  /* -------------------- Download Backup -------------------- */
  const downloadBackupMutation = useMutation({
    mutationFn: async (backupId) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/backups/${backupId}/download`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (!res.ok) throw new Error('Failed to download backup');

      const blob = await res.blob();
      const cd = res.headers.get('content-disposition');
      const filename =
        cd?.split('filename=')[1]?.replace(/"/g, '') ||
        `backup-${backupId}.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success('Backup downloaded'),
    onError: (e) => toast.error(e.message),
  });

  /* -------------------- Restore Backup -------------------- */
  const restoreBackupMutation = useMutation({
    mutationFn: async ({ backupId, options }) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/backups/${backupId}/restore`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(options),
        }
      );
      if (!res.ok) throw new Error('Failed to restore backup');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Backup restored successfully');
      setSelectedBackup(null);
    },
    onError: (e) => toast.error(e.message),
  });

  /* -------------------- Delete Backup -------------------- */
  const deleteBackupMutation = useMutation({
    mutationFn: async (backupId) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/backups/${backupId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (!res.ok) throw new Error('Failed to delete backup');
    },
    onSuccess: () => {
      refetchBackups();
      toast.success('Backup deleted');
    },
    onError: (e) => toast.error(e.message),
  });

  const getBackupTypeIcon = (type) =>
    ({
      full: CloudDownload,
      database: FileText,
      media: Image,
      settings: Settings,
    }[type] || CloudDownload);

  const getBackupTypeColor = (type) =>
    ({
      full: 'bg-blue-100 text-blue-600',
      database: 'bg-green-100 text-green-600',
      media: 'bg-purple-100 text-purple-600',
      settings: 'bg-yellow-100 text-yellow-600',
    }[type] || 'bg-blue-100 text-blue-600');

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Backup & Restore</h1>
          <p className="text-gray-500">Manage site backups</p>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          Last backup:{' '}
          {lastBackupDate
            ? lastBackupDate.toLocaleString()
            : 'Never'}
        </div>
      </div>

      {/* Create Backup */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4">
          <select
            value={backupType}
            onChange={(e) => setBackupType(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="full">Full</option>
            <option value="database">Database</option>
            <option value="media">Media</option>
            <option value="settings">Settings</option>
          </select>

          <button
            onClick={() => createBackupMutation.mutate(backupType)}
            disabled={createBackupMutation.isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create Backup
          </button>
        </div>
      </div>

      {/* Existing Backups */}
      <div className="bg-white rounded-lg shadow divide-y">
        {backups.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No backups available
          </div>
        ) : (
          backups.map((backup) => {
            const Icon = getBackupTypeIcon(backup.type);
            return (
              <div
                key={backup._id}
                className="p-4 flex justify-between items-center"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-full ${getBackupTypeColor(
                      backup.type
                    )}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {backup.name || `${backup.type} backup`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(
                        backup.createdAt
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      downloadBackupMutation.mutate(backup._id)
                    }
                    className="text-blue-600"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setSelectedBackup(backup._id)}
                    className="text-green-600"
                  >
                    <CloudUpload className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() =>
                      deleteBackupMutation.mutate(backup._id)
                    }
                    className="text-red-600"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Restore Modal */}
      {selectedBackup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Restore Backup
            </h3>

            {Object.entries(restoreOptions).map(([key, val]) => (
              <label
                key={key}
                className="flex items-center mb-2"
              >
                <input
                  type="checkbox"
                  checked={val}
                  onChange={(e) =>
                    setRestoreOptions((o) => ({
                      ...o,
                      [key]: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                {key}
              </label>
            ))}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setSelectedBackup(null)}
                className="border px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  restoreBackupMutation.mutate({
                    backupId: selectedBackup,
                    options: restoreOptions,
                  })
                }
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupRestore;
