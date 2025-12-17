import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Check,
  X,
  Trash2,
  Search,
  Filter,
  MessageCircle,
  User,
  FileText,
  AlertTriangle
} from 'lucide-react';
import  commentService  from '../../../services/comments';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';

const CommentModeration = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 20;

  // Fetch comments for moderation
  const { data: comments, isLoading, error } = useQuery({
    queryKey: ['moderation-comments', searchTerm, statusFilter, currentPage],
    queryFn: () => commentService.getCommentsForModeration({
      search: searchTerm,
      status: statusFilter,
      page: currentPage,
      limit: commentsPerPage
    })
  });

  // Approve comment mutation
  const approveMutation = useMutation({
    mutationFn: commentService.approveComment,
    onSuccess: () => {
      queryClient.invalidateQueries(['moderation-comments']);
      // Show success toast
    }
  });

  // Reject comment mutation
  const rejectMutation = useMutation({
    mutationFn: commentService.rejectComment,
    onSuccess: () => {
      queryClient.invalidateQueries(['moderation-comments']);
      // Show success toast
    }
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: commentService.deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries(['moderation-comments']);
      // Show success toast
    }
  });

  const handleApprove = (commentId) => {
    if (window.confirm('Are you sure you want to approve this comment?')) {
      approveMutation.mutate(commentId);
    }
  };

  const handleReject = (commentId) => {
    if (window.confirm('Are you sure you want to reject this comment?')) {
      rejectMutation.mutate(commentId);
    }
  };

  const handleDelete = (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      deleteMutation.mutate(commentId);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      spam: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load comments" />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Comment Moderation</h1>
        <p className="text-gray-600">Review and moderate user comments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[
          { title: 'Pending', value: comments?.stats?.pending || 0, color: 'bg-yellow-500', icon: AlertTriangle },
          { title: 'Approved', value: comments?.stats?.approved || 0, color: 'bg-green-500', icon: Check },
          { title: 'Rejected', value: comments?.stats?.rejected || 0, color: 'bg-red-500', icon: X },
          { title: 'Spam', value: comments?.stats?.spam || 0, color: 'bg-gray-500', icon: Trash2 }
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Comments</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="spam">Spam</option>
          </select>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments?.data?.map((comment) => (
          <div key={comment._id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{comment.author?.name || 'Anonymous'}</h3>
                  <p className="text-sm text-gray-500">{comment.author?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(comment.status)}`}>
                  {comment.status}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-700">{comment.content}</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <Link
                  to={`/blog/${comment.post?.slug}#comment-${comment._id}`}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  View on post
                </Link>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {comment.replies?.length || 0} replies
                </span>
              </div>

              <div className="flex items-center gap-2">
                {comment.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(comment._id)}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(comment._id)}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(comment._id)}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {(!comments?.data || comments.data.length === 0) && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No comments found
            </h3>
            <p className="text-gray-600">
              {statusFilter === 'all' 
                ? 'There are no comments to display.' 
                : `No ${statusFilter} comments found.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {comments?.pagination && comments.pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {currentPage} of {comments.pagination.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage === comments.pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default CommentModeration;