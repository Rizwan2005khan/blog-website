import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
  MessageCircle,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  User,
  FileText,
  Search,
  Filter,
  Upload,
  Download
} from 'lucide-react';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const CommentModeration = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedComments, setSelectedComments] = useState([]);

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', 'admin', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchTerm,
        limit: '50',
        sort: '-createdAt'
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/comments?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  // Approve comment mutation
  const approveCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/comments/${commentId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to approve comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', 'admin']);
      toast.success('Comment approved successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to approve comment');
    },
  });

  // Reject comment mutation
  const rejectCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/comments/${commentId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to reject comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', 'admin']);
      toast.success('Comment rejected successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reject comment');
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', 'admin']);
      toast.success('Comment deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete comment');
    },
  });

  // Bulk actions
  const handleBulkApprove = () => {
    if (selectedComments.length === 0) {
      toast.error('Please select comments to approve');
      return;
    }
    
    Promise.all(
      selectedComments.map(commentId => 
        fetch(`${import.meta.env.VITE_API_URL}/comments/${commentId}/approve`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })
      )
    ).then(() => {
      queryClient.invalidateQueries(['comments', 'admin']);
      setSelectedComments([]);
      toast.success(`${selectedComments.length} comments approved successfully!`);
    }).catch(() => {
      toast.error('Failed to approve selected comments');
    });
  };

  const handleBulkDelete = () => {
    if (selectedComments.length === 0) {
      toast.error('Please select comments to delete');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedComments.length} comments?`)) {
      Promise.all(
        selectedComments.map(commentId => 
          fetch(`${import.meta.env.VITE_API_URL}/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          })
        )
      ).then(() => {
        queryClient.invalidateQueries(['comments', 'admin']);
        setSelectedComments([]);
        toast.success(`${selectedComments.length} comments deleted successfully!`);
      }).catch(() => {
        toast.error('Failed to delete selected comments');
      });
    }
  };

  const handleSelectComment = (commentId) => {
    setSelectedComments(prev => 
      prev.includes(commentId) 
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedComments.length === comments.length) {
      setSelectedComments([]);
    } else {
      setSelectedComments(comments.map(c => c._id));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400',
      spam: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400'
    };
    return badges[status] || badges.pending;
  };

  const stats = {
    total: comments.length,
    pending: comments.filter(c => c.status === 'pending').length,
    approved: comments.filter(c => c.status === 'approved').length,
    rejected: comments.filter(c => c.status === 'rejected').length,
    spam: comments.filter(c => c.status === 'spam').length
  };

  if (isLoading) {
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
            Comment Moderation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and manage user comments
          </p>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Pending</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approved}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Approved</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Rejected</div>
          </div>
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search comments..."
                className="pl-10 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="spam">Spam</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedComments.length > 0 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800 dark:text-blue-300">
                {selectedComments.length} comments selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkApprove}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors duration-200"
                >
                  Approve All
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors duration-200"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No comments found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No comments to moderate at the moment'}
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-start space-x-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedComments.includes(comment._id)}
                    onChange={() => handleSelectComment(comment._id)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                  />

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                    {comment.author?.avatar ? (
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {comment.author?.username}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          on "{comment.post?.title}"
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(comment.status)}`}>
                          {comment.status}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(comment.createdAt), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {comment.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {comment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => approveCommentMutation.mutate(comment._id)}
                            className="flex items-center px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors duration-200"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => rejectCommentMutation.mutate(comment._id)}
                            className="flex items-center px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors duration-200"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteCommentMutation.mutate(comment._id)}
                        className="flex items-center px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors duration-200"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                      <a
                        href={`/post/${comment.post?.slug}#comment-${comment._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentModeration;